<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '../stores/auth.store'
import { getMyMessages, markMessageRead, userApi, messageApi } from '../services/api'
import { useMessageStore } from '../stores/message.store'
import { emojiCategories } from '../constants/emojis'

const isNavCollapsed = ref(true)
const selectedThreadId = ref('')
const threadSearchQuery = ref('')
const searchResults = ref([])
const searchActive = ref(false)
const content = ref('')
const profilePreviewName = ref('')
const loading = ref(false)
const error = ref('')
const sending = ref(false)
const selectedImages = ref([])
const threadListRef = ref(null)
const textareaRef = ref(null)
const fileInputRef = ref(null)
const presenceState = ref({ online: false, typing: false, lastSeen: null })
let presenceInterval = null
let typingInterval = null
let typingTimeout = null
let newMessageInterval = null
const lastPolledAt = ref('')

const inboxMessages = ref([])
const sentMessages = ref([])

// New reactive states for improved features
const showEmojiPicker = ref(false)
const replyingTo = ref(null)
const isDragging = ref(false)
const activeEmojiTab = ref(0)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const messageStore = useMessageStore()

const currentUserId = computed(() => authStore.user?._id || '')

function getTimestamp(value) {
  const time = new Date(value || '').getTime()
  return Number.isFinite(time) ? time : 0
}

function getThreadTimestamp(message) {
  return Math.max(getTimestamp(message?.createdAt), getTimestamp(message?.updatedAt), getTimestamp(message?.readAt))
}

const dayFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

const timeFormatOptions = { hour: '2-digit', minute: '2-digit' }

function formatDateValue(value, options) {
  const timestamp = getTimestamp(value)
  if (!timestamp) {
    return ''
  }

  return new Date(timestamp).toLocaleString([], options)
}

function formatMessageTime(value) {
  return formatDateValue(value, timeFormatOptions)
}

function formatDayLabel(value) {
  return formatDateValue(value, dayFormatOptions)
}

const allMessages = computed(() => {
  return [...inboxMessages.value, ...sentMessages.value].toSorted(
    (a, b) => getThreadTimestamp(b) - getThreadTimestamp(a),
  )
})

const threads = computed(() => {
  const entries = allMessages.value.reduce((acc, message) => {
    const isOutgoing = String(message?.sender?._id || '') === currentUserId.value
    const peer = isOutgoing ? message.recipient : message.sender
    const peerId = String(peer?._id || '')
    if (!peerId) return acc

    const existing = acc[peerId]
    const existingLatest = existing?.latestMessage
    const latestMessage = existingLatest && getThreadTimestamp(message) <= getThreadTimestamp(existingLatest)
      ? existingLatest
      : message
    const unreadCount = (existing?.unreadCount || 0) + (
      !message.isRead && String(message?.recipient?._id || '') === currentUserId.value ? 1 : 0
    )

    return {
      ...acc,
      [peerId]: {
        peerId,
        peer,
        latestMessage,
        unreadCount,
      },
    }
  }, {})

  return Object.values(entries).toSorted(
    (a, b) => getThreadTimestamp(b.latestMessage) - getThreadTimestamp(a.latestMessage),
  )
})

const threadMessages = computed(() => {
  if (!selectedThreadId.value) {
    return []
  }

  return allMessages.value
    .filter((message) => {
      const senderId = String(message?.sender?._id || '')
      const recipientId = String(message?.recipient?._id || '')
      // hide messages the current user soft-deleted
      const deletedFor = Array.isArray(message.deletedFor) ? message.deletedFor.map(String) : []
      if (deletedFor.includes(String(currentUserId.value))) return false
      return senderId === selectedThreadId.value || recipientId === selectedThreadId.value
    })
    .toSorted((a, b) => getThreadTimestamp(a) - getThreadTimestamp(b))
})

const threadTimeline = computed(() => {
  let previousDay = ''

  return threadMessages.value.flatMap((message) => {
    const day = formatDayLabel(message.createdAt)
    const dayRow = day && day !== previousDay
      ? [{ type: 'day', key: `day-${day}`, label: day }]
      : []
    if (day) previousDay = day
    return [...dayRow, { type: 'message', key: message._id, item: message }]
  })
})

const displayedTimeline = computed(() => {
  if (searchActive.value && Array.isArray(searchResults.value) && searchResults.value.length) {
    // build simple timeline from search results (sorted asc)
    let prevDay = ''
    return [...searchResults.value].toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .flatMap((message) => {
        const day = formatDayLabel(message.createdAt)
        const dayRow = day && day !== prevDay
          ? [{ type: 'day', key: `day-${day}`, label: day }]
          : []
        if (day) prevDay = day
        return [...dayRow, { type: 'message', key: message._id, item: message }]
      })
  }

  return threadTimeline.value
})

const selectedThread = computed(() => threads.value.find((item) => item.peerId === selectedThreadId.value) || null)

const unreadInboxCount = computed(() => inboxMessages.value.filter((item) => !item.isRead).length)

const activeRecipientId = computed(() => selectedThreadId.value)

const headerTitle = computed(() => {
  if (selectedThread.value) {
    return selectedThread.value.peer?.displayName || selectedThread.value.peer?.username || 'Unknown user'
  }

  if (profilePreviewName.value) {
    return profilePreviewName.value
  }

  return 'Select a conversation'
})

const imageSummary = computed(() => {
  if (!selectedImages.value.length) {
    return ''
  }

  if (selectedImages.value.length === 1) {
    return selectedImages.value[0]
  }

  return `${selectedImages.value.length} images selected`
})

async function goLogin() {
  await router.push('/login')
}

async function loadProfilePreview(userId) {
  if (!userId) {
    profilePreviewName.value = ''
    return
  }

  try {
    const { data } = await userApi.getProfile(userId)
    profilePreviewName.value = data?.displayName || data?.username || ''
  } catch (_error) {
    profilePreviewName.value = ''
  }
}

async function loadMessages() {
  if (!authStore.isAuthenticated) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const [inboxRes, sentRes] = await Promise.all([
      getMyMessages({ box: 'inbox', limit: 120 }),
      getMyMessages({ box: 'sent', limit: 120 }),
    ])

    inboxMessages.value = Array.isArray(inboxRes.data?.messages) ? inboxRes.data.messages : []
    sentMessages.value = Array.isArray(sentRes.data?.messages) ? sentRes.data.messages : []

    if (selectedThreadId.value) {
      return
    }

    const queryUser = typeof route.query.user === 'string' ? route.query.user : ''
    if (queryUser) {
      selectedThreadId.value = queryUser
      await loadProfilePreview(queryUser)
      return
    }

    if (threads.value.length > 0) {
      selectedThreadId.value = threads.value[0].peerId
    }

    // Initialize poll timestamp so subsequent polls get only new messages
    lastPolledAt.value = new Date().toISOString()
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load messages'
    inboxMessages.value = []
    sentMessages.value = []
  } finally {
    loading.value = false
  }
}

async function searchWithinThread() {
  if (!selectedThreadId.value) return
  const q = String(threadSearchQuery.value || '').trim()
  if (!q) {
    searchActive.value = false
    searchResults.value = []
    return
  }

  try {
    const res = await messageApi.searchThread(selectedThreadId.value, q)
    searchResults.value = Array.isArray(res.data?.messages) ? res.data.messages : []
    searchActive.value = true
  } catch (err) {
    searchResults.value = []
    searchActive.value = false
  }
}

async function deleteMessage(messageId) {
  if (!window.confirm('Delete this message for you? This cannot be undone.')) return
  try {
    await messageStore.softDelete(messageId)
    // Remove from local arrays so UI updates immediately without refresh
    inboxMessages.value = inboxMessages.value.filter(item => item._id !== messageId)
    sentMessages.value = sentMessages.value.filter(item => item._id !== messageId)
  } catch (err) {
    // ignore for now
  }
}

function startPresencePolling(peerId) {
  stopPresencePolling()
  if (!peerId) return
  const pollPresence = async () => {
    try {
      const res = await userApi.getPresence(peerId)
      presenceState.value = res.data || { online: false, typing: false }
    } catch (e) {
      presenceState.value = { online: false, typing: false }
    }
  }

  // initial
  pollPresence()
  presenceInterval = setInterval(pollPresence, 30 * 1000)
  typingInterval = setInterval(pollPresence, 5 * 1000)
}

function stopPresencePolling() {
  if (presenceInterval) clearInterval(presenceInterval)
  if (typingInterval) clearInterval(typingInterval)
  presenceInterval = null
  typingInterval = null
  presenceState.value = { online: false, typing: false }
}

function startMessagePolling() {
  stopMessagePolling() // ensure no duplicate intervals
  // Initialize lastPolledAt to now if not set
  if (!lastPolledAt.value) {
    lastPolledAt.value = new Date().toISOString()
  }
  // Poll every 10 seconds
  newMessageInterval = setInterval(pollNewMessages, 10 * 1000)
}

function stopMessagePolling() {
  if (newMessageInterval) {
    clearInterval(newMessageInterval)
    newMessageInterval = null
  }
}

async function pollNewMessages() {
  if (!authStore.isAuthenticated || !lastPolledAt.value) return

  try {
    const [inboxRes, sentRes] = await Promise.all([
      getMyMessages({ box: 'inbox', since: lastPolledAt.value, limit: 50 }),
      getMyMessages({ box: 'sent', since: lastPolledAt.value, limit: 50 }),
    ])

    // Update lastPolledAt to current time for next poll
    lastPolledAt.value = new Date().toISOString()

    const newInbox = Array.isArray(inboxRes.data?.messages) ? inboxRes.data.messages : []
    const newSent = Array.isArray(sentRes.data?.messages) ? sentRes.data.messages : []

    // Get IDs already in the arrays
    const existingInboxIds = new Set(inboxMessages.value.map(m => m._id))
    const existingSentIds = new Set(sentMessages.value.map(m => m._id))

    // Prepend only truly new messages (not already present)
    const freshInbox = newInbox.filter(m => !existingInboxIds.has(m._id))
    const freshSent = newSent.filter(m => !existingSentIds.has(m._id))

    // Messages from API are sorted newest-first (createdAt: -1),
    // so prepending maintains the correct order
    if (freshInbox.length > 0) {
      inboxMessages.value = [...freshInbox, ...inboxMessages.value]
    }
    if (freshSent.length > 0) {
      sentMessages.value = [...freshSent, ...sentMessages.value]
    }
  } catch {
    // Silently ignore polling errors
  }
}

function onUserTyping() {
  // send typing signal for self
  if (typingTimeout) clearTimeout(typingTimeout)
  const myId = authStore.user?._id
  if (myId) {
    userApi.postPresence(myId, { typing: true }).catch(() => {})
  }
  typingTimeout = setTimeout(() => {
    // stop typing after a short idle
    if (myId) userApi.postPresence(myId, { typing: false }).catch(() => {})
  }, 2500)
}

const chatBodyRef = ref(null)

// Synthesize a sweet, gentle notification tone using Web Audio API
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc1 = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12) // A5
    
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(293.66, audioCtx.currentTime) // D4
    osc2.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.12) // A4
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.22)
    
    osc1.start(audioCtx.currentTime)
    osc2.start(audioCtx.currentTime)
    osc1.stop(audioCtx.currentTime + 0.22)
    osc2.stop(audioCtx.currentTime + 0.22)
  } catch (e) {
    console.warn('Notification sound blocked or unsupported by browser', e)
  }
}

// Handle Auto-Growing textarea heights
function adjustTextareaHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(content, () => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})

// Parse custom quote syntax
function parseMessageContent(text) {
  if (!text) return { quote: null, body: '' }
  const match = text.match(/^>\s\*\*Replying to @([^*]+)\*\*:\s"([\s\S]*?)"\n\n([\s\S]*)$/)
  if (match) {
    return {
      quote: {
        user: match[1],
        content: match[2]
      },
      body: match[3]
    }
  }
  return { quote: null, body: text }
}

function parseMessageBody(text) {
  if (!text) return { text: '', images: [] }
  
  // Find all standalone image URLs in the content
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp)(?:\?[^\s]*)?)/gi
  const images = []
  let processed = text
  
  // Also handle [Image] filename pattern (local files that weren't uploaded)
  // These can't be displayed since they're not uploaded, so we filter them out
  processed = processed.replace(/\[Image\][^\n]*/gi, '').trim()
  
  // Extract standalone image URLs
  let match
  while ((match = imageUrlRegex.exec(text)) !== null) {
    images.push(match[1])
  }
  
  // Remove image URLs from text display
  const textWithoutUrls = text.replace(imageUrlRegex, '').replace(/\s+/g, ' ').trim()
  
  return {
    text: textWithoutUrls || processed,
    images: images,
  }
}

// Refined cursor-aware emoji injection
function insertEmoji(emoji) {
  const textarea = textareaRef.value
  if (!textarea) {
    content.value += emoji
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = content.value

  content.value = text.slice(0, start) + emoji + text.slice(end)
  
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + emoji.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    adjustTextareaHeight()
  }, 0)
}

// Handlers for image drag-and-drop
function handleDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e) {
  isDragging.value = false
}

function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false
  
  if (!selectedThreadId.value) return
  
  const files = Array.from(e.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  if (imageFiles.length > 0) {
    selectedImages.value = [...selectedImages.value, ...imageFiles.map(file => file.name)]
  }
}

// Elegant smooth scrolling to bottom of conversation
function scrollChatToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const recipientId = activeRecipientId.value
  if (!recipientId) {
    error.value = 'Please choose a conversation first'
    return
  }

  const trimmedContent = content.value.trim()
  const hasFiles = selectedImages.value.length > 0

  if (!trimmedContent && !hasFiles) {
    error.value = 'Please enter a message or choose at least one image'
    return
  }

  let payloadContent = trimmedContent

  // Prepend reply blockquote if active
  if (replyingTo.value) {
    const cleanQuoteContent = replyingTo.value.content.replace(/\r?\n/g, ' ')
    const peerName = replyingTo.value.sender?.displayName || replyingTo.value.sender?.username || 'user'
    payloadContent = `> **Replying to @${peerName}**: "${cleanQuoteContent}"\n\n${payloadContent || ''}`
  }

  sending.value = true
  error.value = ''

  try {
    let data

    if (hasFiles) {
      // Build FormData with images
      const formData = new FormData()
      if (payloadContent) formData.append('content', payloadContent)
      formData.append('recipientId', recipientId)

      // Get actual File objects from the file input element
      if (fileInputRef.value?.files) {
        for (let i = 0; i < fileInputRef.value.files.length; i++) {
          formData.append('images', fileInputRef.value.files[i])
        }
      }

      data = await messageStore.sendMessage(formData)
    } else {
      data = await messageStore.sendMessage({
        recipientId,
        content: payloadContent,
      })
    }

    sentMessages.value = [data, ...sentMessages.value.filter((item) => item._id !== data._id)]
    if (!selectedThreadId.value) {
      selectedThreadId.value = recipientId
    }

    content.value = ''
    selectedImages.value = []
    replyingTo.value = null
    showEmojiPicker.value = false

    // Reset file input
    if (fileInputRef.value) fileInputRef.value.value = ''

    nextTick(() => {
      adjustTextareaHeight()
      scrollChatToBottom()
    })
  } catch (sendError) {
    error.value = sendError?.response?.data?.message || 'Failed to send message'
  } finally {
    sending.value = false
  }
}

async function markAsRead(messageId) {
  try {
    await markMessageRead(messageId)
    inboxMessages.value = inboxMessages.value.map((item) => {
      if (item._id !== messageId) {
        return item
      }

      return {
        ...item,
        isRead: true,
        readAt: new Date().toISOString(),
      }
    })
  } catch (_error) {
    // Keep silent for per-message read errors.
  }
}

async function selectThread(peerId) {
  selectedThreadId.value = peerId

  const unreadRows = threadMessages.value.filter(
    (item) => !item.isRead && String(item?.recipient?._id || '') === currentUserId.value,
  )

  await Promise.all(unreadRows.map((item) => markAsRead(item._id)))
  
  replyingTo.value = null
  showEmojiPicker.value = false
  scrollChatToBottom()
}

function handleImageSelect(event) {
  const files = Array.from(event.target?.files || [])
  selectedImages.value = files.map((file) => file.name)
}

function clearSelectedImages() {
  selectedImages.value = []
}

function scrollThreadListToTop() {
  if (threadListRef.value) {
    threadListRef.value.scrollTop = 0
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

onMounted(() => {
  loadMessages()
})

watch(threads, () => {
  scrollThreadListToTop()
})

watch(threadMessages, () => {
  scrollChatToBottom()
}, { deep: true })

watch(
  () => inboxMessages.value.length,
  (newCount, oldCount) => {
    if (oldCount !== undefined && newCount > oldCount) {
      const latestInboxMsg = inboxMessages.value[0]
      if (latestInboxMsg && String(latestInboxMsg.sender?._id || '') !== currentUserId.value) {
        playNotificationSound()
      }
    }
  }
)

watch(
  () => route.query.user,
  async (userId) => {
    if (typeof userId !== 'string' || !userId) {
      return
    }

    selectedThreadId.value = userId
    await loadProfilePreview(userId)
    scrollChatToBottom()
  },
)

watch(selectedThreadId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    startPresencePolling(newVal)
    startMessagePolling()
  } else if (!newVal) {
    stopPresencePolling()
    stopMessagePolling()
  }
})

onUnmounted(() => {
  stopPresencePolling()
  stopMessagePolling()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" :class="['message-shell page-block', { 'mobile-chat-open': selectedThreadId }]">
      
      <aside class="thread-list-pane">
        <header class="pane-head">
          <div>
              <h1 class="h5 mb-0">Chats</h1>
            <p class="text-secondary mb-0 small">Unread: {{ unreadInboxCount }}</p>
          </div>
          <router-link to="/account" class="pane-link">Message settings</router-link>
        </header>

        <!-- Skeleton Loader for Threads List -->
        <div v-if="loading" class="pane-skeletons" aria-hidden="true">
          <div v-for="i in 5" :key="i" class="skeleton-thread-item">
            <div class="skeleton-avatar shimmer"></div>
            <div class="skeleton-meta">
              <div class="skeleton-line shimmer short"></div>
              <div class="skeleton-line shimmer medium"></div>
            </div>
          </div>
        </div>
        <p v-else-if="error" class="pane-note error">{{ error }}</p>

        <div v-else-if="threads.length" ref="threadListRef" class="thread-list" role="listbox" aria-label="Conversation threads">
          <button
            v-for="thread in threads"
            :key="thread.peerId"
            type="button"
            class="thread-item"
            :class="{ active: selectedThreadId === thread.peerId }"
            @click="selectThread(thread.peerId)"
          >
            <div class="thread-avatar"><img :src="thread.peer?.avatar || 'https://s.pximg.net/common/images/no_profile.png'" alt="avatar" @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'" /></div>
            <div class="thread-meta">
              <div class="thread-top">
                <strong>{{ thread.peer?.displayName || thread.peer?.username || 'Unknown user' }}</strong>
                <small>{{ formatMessageTime(thread.latestMessage.createdAt) }}</small>
              </div>
              <p>{{ parseMessageBody(thread.latestMessage.content).text || parseMessageContent(thread.latestMessage.content).body }}</p>
            </div>
            <span v-if="thread.unreadCount" class="thread-badge">{{ thread.unreadCount }}</span>
          </button>
        </div>

        <p v-else class="pane-note">No messages yet.</p>
      </aside>

      <section 
        class="thread-pane"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <header class="pane-head thread-head">
          <div style="display:flex;align-items:center;gap:0.6rem;width:100%;">
            <button v-if="selectedThreadId" type="button" class="btn btn-sm btn-outline-secondary mobile-back" @click="selectedThreadId = ''">Back</button>
            <h2 class="h6 mb-0" style="flex:1;display:flex;align-items:center;gap:0.35rem;">
              {{ headerTitle }}
              <span v-if="selectedThreadId && presenceState.online" class="presence-indicator">
                <span class="presence-dot" :class="{ online: !presenceState.typing, typing: presenceState.typing }"></span>
                <span class="presence-text">{{ presenceState.typing ? 'typing...' : 'Online' }}</span>
              </span>
              <span v-else-if="selectedThreadId && !presenceState.online && presenceState.lastSeen" class="presence-indicator">
                <span class="presence-dot offline"></span>
                <span class="presence-text">Offline</span>
              </span>
            </h2>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <input v-model="threadSearchQuery" placeholder="Search this conversation" class="thread-search-input form-control form-control-sm" style="width:220px" />
              <button type="button" class="btn btn-sm btn-outline-primary" @click="searchWithinThread">Search</button>
              <button v-if="searchActive" type="button" class="btn btn-sm btn-outline-secondary" @click="() => { searchActive=false; threadSearchQuery=''; searchResults=[] }">Clear</button>
            </div>
          </div>
        </header>

        <!-- Drag & Drop overlay indicator -->
        <div v-if="isDragging" class="drag-drop-overlay">
          <div class="drag-drop-box">
            <i class="fa-regular fa-image drag-icon"></i>
            <p>Drop images here to attach</p>
          </div>
        </div>

        <div class="thread-body" ref="chatBodyRef">
          <!-- Skeleton Shimmer Loader for Messages Flow -->
          <div v-if="loading" class="skeleton-flow" aria-hidden="true">
            <div v-for="i in 4" :key="i" class="skeleton-bubble-wrap" :class="i % 2 === 0 ? 'outgoing' : 'incoming'">
              <div class="skeleton-bubble shimmer"></div>
            </div>
          </div>

          <div v-else-if="displayedTimeline.length" class="message-flow">
            <template v-for="row in displayedTimeline" :key="row.key">
              <p v-if="row.type === 'day'" class="day-separator">{{ row.label }}</p>
              <article
                v-else
                class="bubble"
                :class="[
                  String(row.item?.sender?._id || '') === currentUserId ? 'outgoing' : 'incoming',
                  parseMessageContent(row.item.content).quote ? 'has-quote' : ''
                ]"
              >
                <img v-if="String(row.item?.sender?._id || '') !== currentUserId" class="msg-avatar" :src="row.item.sender?.avatar || 'https://s.pximg.net/common/images/no_profile.png'" alt="avatar" @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'" />
                <!-- Render Quote if present -->
                <div v-if="parseMessageContent(row.item.content).quote" class="bubble-quote">
                  <span class="quote-user">
                    <i class="fa-solid fa-reply"></i> @{{ parseMessageContent(row.item.content).quote.user }}
                  </span>
                  <p class="quote-text">{{ parseMessageContent(row.item.content).quote.content }}</p>
                </div>

                <div class="bubble-body-wrap">
                  <p v-if="parseMessageBody(row.item.content).text" class="bubble-body">{{ parseMessageBody(row.item.content).text }}</p>
                  <div v-if="row.item.images && row.item.images.length" class="bubble-images">
                    <img v-for="(imgUrl, idx) in row.item.images" :key="idx" :src="imgUrl" alt="Message image" class="bubble-image" @error="(e) => e.target.style.display = 'none'" @load="scrollChatToBottom" />
                  </div>
                  <div v-else-if="parseMessageBody(row.item.content).images.length" class="bubble-images">
                    <img v-for="(imgUrl, idx) in parseMessageBody(row.item.content).images" :key="idx" :src="imgUrl" alt="Message image" class="bubble-image" @error="(e) => e.target.style.display = 'none'" @load="scrollChatToBottom" />
                  </div>
                </div>
                
                <div class="bubble-footer">
                  <span v-if="String(row.item?.sender?._id || '') === currentUserId" class="msg-status" :class="{ read: row.item.isRead }">
                    <i v-if="row.item.isRead" class="fa-solid fa-check-double" title="Read"></i>
                    <i v-else class="fa-solid fa-check" title="Sent"></i>
                  </span>
                  <small class="msg-time">{{ formatMessageTime(row.item.createdAt) }}</small>
                </div>

                <!-- Bubble action buttons (reply + delete) -->
                <div class="bubble-actions">
                  <button
                    type="button"
                    class="bubble-reply-btn"
                    title="Reply to this message"
                    @click="replyingTo = row.item"
                  >
                    <i class="fa-solid fa-reply"></i>
                  </button>
                  <button
                    v-if="(String(row.item?.sender?._id || '') === currentUserId) || (String(row.item?.recipient?._id || '') === currentUserId)"
                    type="button"
                    class="bubble-delete-btn"
                    title="Delete for me"
                    @click.prevent="deleteMessage(row.item._id)"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>

                <button
                  v-if="String(row.item?.recipient?._id || '') === currentUserId && !row.item.isRead"
                  type="button"
                  class="mark-read"
                  @click="markAsRead(row.item._id)"
                >
                  Mark read
                </button>
              </article>
            </template>
          </div>
          <p v-else class="pane-note">No conversation selected. Pick a user from the left to start chatting.</p>
        </div>

        <!-- Replying Context Bar -->
        <div v-if="replyingTo" class="reply-context-bar">
          <div class="reply-context-info">
            <i class="fa-solid fa-reply reply-icon"></i>
            <div class="reply-context-text">
              <span class="reply-to-user">Replying to <strong>@{{ replyingTo.sender?.username || 'user' }}</strong></span>
              <p class="reply-to-snippet">{{ parseMessageContent(replyingTo.content).body }}</p>
            </div>
          </div>
          <button type="button" class="btn-close-reply" @click="replyingTo = null" aria-label="Cancel reply">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Premium Compose Form -->
        <form class="compose-row-advanced" @submit.prevent="sendMessage">
          <div class="compose-input-wrapper">
            <textarea
              ref="textareaRef"
              v-model="content"
              class="compose-textarea"
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows="1"
              :disabled="sending || !selectedThreadId"
              @keydown.enter.prevent="e => { if (!e.shiftKey) sendMessage() }"
              @input="onUserTyping"
            ></textarea>
            
            <button
              type="button"
              class="compose-emoji-btn"
              :class="{ active: showEmojiPicker }"
              :disabled="!selectedThreadId"
              @click="showEmojiPicker = !showEmojiPicker"
              aria-label="Toggle emoji picker"
            >
              <i class="fa-regular fa-face-smile"></i>
            </button>

            <!-- Custom Emoji Drawer inside input wrapper -->
            <div v-if="showEmojiPicker" class="emoji-drawer-panel">
              <div class="emoji-drawer-tabs">
                <button
                  v-for="(cat, index) in emojiCategories"
                  :key="cat.name"
                  type="button"
                  class="emoji-tab-btn"
                  :class="{ active: activeEmojiTab === index }"
                  @click="activeEmojiTab = index"
                >
                  {{ cat.name }}
                </button>
              </div>
              <div class="emoji-drawer-list">
                <button
                  v-for="emoji in emojiCategories[activeEmojiTab].emojis"
                  :key="emoji"
                  type="button"
                  class="emoji-item-btn"
                  @click="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>

          <label class="image-picker-advanced" :class="{ disabled: !selectedThreadId }" aria-label="Add images">
            <i class="fa-regular fa-image" aria-hidden="true"></i>
            <input ref="fileInputRef" type="file" multiple accept="image/*" :disabled="!selectedThreadId" @change="handleImageSelect" />
          </label>

          <button 
            class="compose-send-advanced" 
            type="submit" 
            :disabled="sending || !selectedThreadId || (!content.trim() && !selectedImages.length)"
          >
            <i class="fa-regular fa-paper-plane" v-if="!sending"></i>
            <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </button>
        </form>
        
        <div v-if="imageSummary" class="image-summary">
          <span>{{ imageSummary }}</span>
          <button type="button" @click="clearSelectedImages">Clear</button>
        </div>
      </section>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Messages</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped src="./MessagesView.css"></style>
