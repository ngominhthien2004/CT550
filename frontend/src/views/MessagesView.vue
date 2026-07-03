<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import ThreadListPane from '../components/messages/ThreadListPane.vue'
import ThreadChatPane from '../components/messages/ThreadChatPane.vue'

import { useAuthStore } from '../stores/auth.store'
import { getMyMessages, markMessageRead, userApi, messageApi, reportApi } from '../services/api'
import { useMessageStore } from '../stores/message.store'
import { useSocket } from '../composables/useSocket'

import { formatShortDate } from '../utils/date.js'

const isNavCollapsed = ref(true)
const selectedThreadId = ref('')
const threadSearchQuery = ref('')
const searchResults = ref([])
const searchActive = ref(false)
const content = ref('')
const profilePreviewName = ref('')
const profilePreviewAvatar = ref('')
const loading = ref(false)
const error = ref('')
const sending = ref(false)
const selectedImages = ref([])
const selectedImageFiles = ref([])
const threadListRef = ref(null)
const textareaRef = ref(null)
const presenceState = ref({ online: false, typing: false, lastSeen: null })
let presenceInterval = null
let typingInterval = null
let typingTimeout = null
let newMessageInterval = null
const lastPolledAt = ref('')

const inboxMessages = ref([])
const sentMessages = ref([])

const showEmojiPicker = ref(false)
const replyingTo = ref(null)
const isDragging = ref(false)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const { connect: connectSocket, disconnect: disconnectSocket, on: socketOn, off: socketOff } = useSocket()

const currentUserId = computed(() => authStore.user?._id || '')

function getTimestamp(value) {
  const time = new Date(value || '').getTime()
  return Number.isFinite(time) ? time : 0
}

function getThreadTimestamp(message) {
  return Math.max(getTimestamp(message?.createdAt), getTimestamp(message?.updatedAt), getTimestamp(message?.readAt))
}

const dayFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const timeFormatOptions = { hour: '2-digit', minute: '2-digit' }

function formatDateValue(value, options) {
  const timestamp = getTimestamp(value)
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString([], options)
}

function formatMessageTime(value) {
  return formatShortDate(value)
}

function formatDayLabel(value) {
  return formatDateValue(value, dayFormatOptions)
}

const allMessages = computed(() => {
  return [...inboxMessages.value, ...sentMessages.value].toSorted(
    (a, b) => getThreadTimestamp(b) - getThreadTimestamp(a),
  )
})

function parseMessageContent(text) {
  if (!text) return { quote: null, body: '' }
  // New format: > Replying to @user\n\nbody  or  > Replying to @user: [Image]\n\nbody
  const match = text.match(/^>\sReplying to @([^\n]+?)(?::\s(.+))?\n\n([\s\S]*)$/)
  if (match) {
    return { quote: { user: match[1], content: match[2] || '' }, body: match[3] }
  }
  // Old format (backward compat for existing messages):
  // > **Replying to @user**: "text"\n\nbody
  const oldMatch = text.match(/^>\s\*\*Replying to @([^*]+)\*\*:\s"([\s\S]*?)"\n\n([\s\S]*)$/)
  if (oldMatch) {
    return { quote: { user: oldMatch[1], content: oldMatch[2] }, body: oldMatch[3] }
  }
  return { quote: null, body: text }
}

function parseMessageBody(text) {
  if (!text) return { text: '', images: [] }
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp)(?:\?[^\s]*)?)/gi
  const images = []
  let processed = text.replace(/\[Image\][^\n]*/gi, '').trim()
  let match
  while ((match = imageUrlRegex.exec(text)) !== null) {
      images.push(match[1])
  }
  const textWithoutUrls = text.replace(imageUrlRegex, '').replace(/\s+/g, ' ').trim()
  return { text: textWithoutUrls || processed, images }
}

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
    return { ...acc, [peerId]: { peerId, peer, latestMessage, unreadCount } }
  }, {})
  return Object.values(entries).toSorted(
    (a, b) => getThreadTimestamp(b.latestMessage) - getThreadTimestamp(a.latestMessage),
  ).map((thread) => ({
    ...thread,
    _formattedTime: formatMessageTime(thread.latestMessage.createdAt),
    _previewText: (() => {
      const body = parseMessageBody(thread.latestMessage.content)
      if (body.images.length > 0 || (thread.latestMessage.images && thread.latestMessage.images.length > 0)) return '[Image]'
      return body.text || parseMessageContent(thread.latestMessage.content).body
    })(),
  }))
})

const threadMessages = computed(() => {
  if (!selectedThreadId.value) return []
  return allMessages.value
    .filter((message) => {
      const senderId = String(message?.sender?._id || '')
      const recipientId = String(message?.recipient?._id || '')
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
    const dayRow = day && day !== previousDay ? [{ type: 'day', key: `day-${day}`, label: day }] : []
    if (day) previousDay = day
    return [...dayRow, { type: 'message', key: message._id, item: message }]
  })
})

const displayedTimeline = computed(() => {
  let raw
  if (searchActive.value && Array.isArray(searchResults.value) && searchResults.value.length) {
    let prevDay = ''
    raw = [...searchResults.value].toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .flatMap((message) => {
        const day = formatDayLabel(message.createdAt)
        const dayRow = day && day !== prevDay ? [{ type: 'day', key: `day-${day}`, label: day }] : []
        if (day) prevDay = day
        return [...dayRow, { type: 'message', key: message._id, item: message }]
      })
  } else {
    raw = threadTimeline.value
  }
  return raw.map((row) => {
    if (row.type === 'day') return row
    const parsed = parseMessageContent(row.item.content)
    return { ...row, _parsed: parsed, _body: parseMessageBody(parsed.body || row.item.content), _formattedTime: formatMessageTime(row.item.createdAt) }
  })
})

const selectedThread = computed(() => threads.value.find((item) => item.peerId === selectedThreadId.value) || null)
const unreadInboxCount = computed(() => inboxMessages.value.filter((item) => !item.isRead).length)
const activeRecipientId = computed(() => selectedThreadId.value)

const headerTitle = computed(() => {
  if (selectedThread.value) return selectedThread.value.peer?.displayName || selectedThread.value.peer?.username || 'Unknown user'
  if (profilePreviewName.value) return profilePreviewName.value
  return 'Select a conversation'
})

const headerAvatar = computed(() => {
  if (selectedThread.value) return selectedThread.value.peer?.avatar || ''
  return profilePreviewAvatar.value
})

async function goLogin() { await router.push('/login') }

async function loadProfilePreview(userId) {
  if (!userId) { profilePreviewName.value = ''; profilePreviewAvatar.value = ''; return }
  try {
    const { data } = await userApi.getProfile(userId)
    profilePreviewName.value = data?.displayName || data?.username || ''
    profilePreviewAvatar.value = data?.avatar || ''
  } catch { profilePreviewName.value = ''; profilePreviewAvatar.value = '' }
}

async function loadMessages() {
  if (!authStore.isAuthenticated) return
  loading.value = true
  error.value = ''
  try {
    const [inboxRes, sentRes] = await Promise.all([
      getMyMessages({ box: 'inbox', limit: 120 }),
      getMyMessages({ box: 'sent', limit: 120 }),
    ])
    inboxMessages.value = Array.isArray(inboxRes.data?.messages) ? inboxRes.data.messages : []
    sentMessages.value = Array.isArray(sentRes.data?.messages) ? sentRes.data.messages : []
    const queryUser = typeof route.query.user === 'string' ? route.query.user : ''
    if (queryUser && !selectedThreadId.value) {
      selectedThreadId.value = queryUser
      await loadProfilePreview(queryUser)
    } else if (!selectedThreadId.value && threads.value.length > 0) {
      selectedThreadId.value = threads.value[0].peerId
    }
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
  if (!q) { searchActive.value = false; searchResults.value = []; return }
  try {
    const res = await messageApi.searchThread(selectedThreadId.value, q)
    searchResults.value = Array.isArray(res.data?.messages) ? res.data.messages : []
    searchActive.value = true
  } catch { searchResults.value = []; searchActive.value = false }
}

async function deleteMessage(messageId) {
  if (!window.confirm('Delete this message for you? This cannot be undone.')) return
  try {
    await messageStore.softDelete(messageId)
    inboxMessages.value = inboxMessages.value.filter(item => item._id !== messageId)
    sentMessages.value = sentMessages.value.filter(item => item._id !== messageId)
  } catch {}
}

function startPresencePolling(peerId) {
  stopPresencePolling()
  if (!peerId) return
  const pollPresence = async () => {
    try {
      const res = await userApi.getPresence(peerId)
      presenceState.value = res.data || { online: false, typing: false }
    } catch { presenceState.value = { online: false, typing: false } }
  }
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
  stopMessagePolling()
  if (!lastPolledAt.value) lastPolledAt.value = new Date().toISOString()
  newMessageInterval = setInterval(pollNewMessages, 10 * 1000)
}

function stopMessagePolling() {
  if (newMessageInterval) { clearInterval(newMessageInterval); newMessageInterval = null }
}

function handleIncomingMessage(message) {
  if (!message || !message._id) return
  const myId = currentUserId.value
  const isIncoming = String(message.recipient?._id || '') === String(myId)
  if (!isIncoming) return

  const exists = [...inboxMessages.value, ...sentMessages.value].some(m => m._id === message._id)
  if (exists) return

  inboxMessages.value = [message, ...inboxMessages.value]

  if (selectedThreadId.value !== String(message.sender?._id || '')) {
    playNotificationSound()
  }
}

async function pollNewMessages() {
  if (!authStore.isAuthenticated || !lastPolledAt.value) return
  try {
    const [inboxRes, sentRes] = await Promise.all([
      getMyMessages({ box: 'inbox', since: lastPolledAt.value, limit: 50 }),
      getMyMessages({ box: 'sent', since: lastPolledAt.value, limit: 50 }),
    ])
    lastPolledAt.value = new Date().toISOString()
    const newInbox = Array.isArray(inboxRes.data?.messages) ? inboxRes.data.messages : []
    const newSent = Array.isArray(sentRes.data?.messages) ? sentRes.data.messages : []
    const existingInboxIds = new Set(inboxMessages.value.map(m => m._id))
    const existingSentIds = new Set(sentMessages.value.map(m => m._id))
    const freshInbox = newInbox.filter(m => !existingInboxIds.has(m._id))
    const freshSent = newSent.filter(m => !existingSentIds.has(m._id))
    if (freshInbox.length > 0) inboxMessages.value = [...freshInbox, ...inboxMessages.value]
    if (freshSent.length > 0) sentMessages.value = [...freshSent, ...sentMessages.value]
  } catch {}
}

function onUserTyping() {
  if (typingTimeout) clearTimeout(typingTimeout)
  const myId = authStore.user?._id
  if (myId) userApi.postPresence(myId, { typing: true }).catch(() => {})
  typingTimeout = setTimeout(() => {
    if (myId) userApi.postPresence(myId, { typing: false }).catch(() => {})
  }, 2500)
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc1 = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    osc1.connect(gainNode); osc2.connect(gainNode); gainNode.connect(audioCtx.destination)
    osc1.type = 'sine'; osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12)
    osc2.type = 'triangle'; osc2.frequency.setValueAtTime(293.66, audioCtx.currentTime); osc2.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.12)
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.22)
    osc1.start(audioCtx.currentTime); osc2.start(audioCtx.currentTime)
    osc1.stop(audioCtx.currentTime + 0.22); osc2.stop(audioCtx.currentTime + 0.22)
  } catch (e) { console.warn('Notification sound blocked or unsupported by browser', e) }
}

function handleImageSelect(event) {
  const files = Array.from(event.target?.files || [])
  selectedImages.value = files.map((file) => file.name)
  selectedImageFiles.value = files
}

function clearSelectedImages() { selectedImages.value = []; selectedImageFiles.value = [] }

function handleDragOver(e) { e.preventDefault(); isDragging.value = true }
function handleDragLeave() { isDragging.value = false }
function handleDrop(e) {
  e.preventDefault(); isDragging.value = false
  if (!selectedThreadId.value) return
  const files = Array.from(e.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  if (imageFiles.length > 0) {
    selectedImages.value = [...selectedImages.value, ...imageFiles.map(file => file.name)]
    selectedImageFiles.value = [...selectedImageFiles.value, ...imageFiles]
  }
}

async function sendMessage() {
  const recipientId = activeRecipientId.value
  if (!recipientId) { error.value = 'Please choose a conversation first'; return }
  const trimmedContent = content.value.trim()
  const hasFiles = selectedImages.value.length > 0
  if (!trimmedContent && !hasFiles) { error.value = 'Please enter a message or choose at least one image'; return }
  let payloadContent = trimmedContent
  if (replyingTo.value) {
    const peerName = replyingTo.value.sender?.displayName || replyingTo.value.sender?.username || 'user'
    const hasImages = (replyingTo.value.images && replyingTo.value.images.length > 0) || parseMessageBody(replyingTo.value.content || '').images.length > 0
    const contentText = hasImages ? '[Image]' : ''
    payloadContent = `> Replying to @${peerName}${contentText ? ': ' + contentText : ''}\n\n${payloadContent || ''}`
  }
  sending.value = true; error.value = ''
  try {
    let data
    if (hasFiles) {
      const formData = new FormData()
      if (payloadContent) formData.append('content', payloadContent)
      formData.append('recipientId', recipientId)
      for (const file of selectedImageFiles.value) formData.append('images', file)
      data = await messageStore.sendMessage(formData)
    } else {
      data = await messageStore.sendMessage({ recipientId, content: payloadContent })
    }
    sentMessages.value = [data, ...sentMessages.value.filter((item) => item._id !== data._id)]
    if (!selectedThreadId.value) selectedThreadId.value = recipientId
    content.value = ''; selectedImages.value = []; selectedImageFiles.value = []; replyingTo.value = null; showEmojiPicker.value = false
    nextTick(() => { scrollChatToBottom() })
  } catch (sendError) {
    error.value = sendError?.response?.data?.message || 'Failed to send message'
  } finally { sending.value = false }
}

async function blockUser() {
  if (!selectedThreadId.value) return
  if (!window.confirm('Block this user? You won\'t receive messages from them.')) return
  try {
    await userApi.block(selectedThreadId.value)
    selectedThreadId.value = ''
    await loadMessages()
  } catch (e) { alert(e?.response?.data?.message || 'Failed to block user') }
}

async function reportUser() {
  if (!selectedThreadId.value) return
  const reason = window.prompt('Report reason:')
  if (!reason) return
  try {
    await reportApi.reportUser(selectedThreadId.value, { reason })
    alert('Report submitted. Thank you.')
  } catch (e) { alert(e?.response?.data?.message || 'Failed to report user') }
}

async function markAsRead(messageId) {
  try {
    await markMessageRead(messageId)
    inboxMessages.value = inboxMessages.value.map((item) => {
      if (item._id !== messageId) return item
      return { ...item, isRead: true, readAt: new Date().toISOString() }
    })
  } catch {}
}

async function selectThread(peerId) {
  selectedThreadId.value = peerId
  const unreadRows = threadMessages.value.filter(
    (item) => !item.isRead && String(item?.recipient?._id || '') === currentUserId.value,
  )
  await Promise.all(unreadRows.map((item) => markAsRead(item._id)))
  replyingTo.value = null; showEmojiPicker.value = false
  scrollChatToBottom()
}

const chatPaneRef = ref(null)
function scrollChatToBottom() {
  nextTick(() => { chatPaneRef.value?.scrollToBottom?.() })
}

function scrollThreadListToTop() {
  if (threadListRef.value) threadListRef.value.scrollTop = 0
}

function toggleLeftNav() { isNavCollapsed.value = !isNavCollapsed.value }

onMounted(() => {
  loadMessages()
  connectSocket()
  socketOn('message:new', handleIncomingMessage)
})
watch(threads, () => { scrollThreadListToTop() })
watch(threadMessages, () => { scrollChatToBottom() })
watch(() => inboxMessages.value.length, (newCount, oldCount) => {
  if (oldCount !== undefined && newCount > oldCount) {
    const latestInboxMsg = inboxMessages.value[0]
    if (latestInboxMsg && String(latestInboxMsg.sender?._id || '') !== currentUserId.value) playNotificationSound()
  }
})
watch(() => route.query.user, async (userId) => {
  if (typeof userId !== 'string' || !userId) return
  selectedThreadId.value = userId
  await loadProfilePreview(userId)
  scrollChatToBottom()
})
watch(selectedThreadId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) { startPresencePolling(newVal); startMessagePolling() }
  else if (!newVal) { stopPresencePolling(); stopMessagePolling() }
})
onUnmounted(() => {
  stopPresencePolling()
  stopMessagePolling()
  socketOff('message:new', handleIncomingMessage)
  disconnectSocket()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" :class="['message-shell page-block', { 'mobile-chat-open': selectedThreadId }]">
      <ThreadListPane
        ref="threadListRef"
        :threads="threads"
        :selected-thread-id="selectedThreadId"
        :loading="loading"
        :error="error"
        :unread-count="unreadInboxCount"
        @select="selectThread"
      />

      <ThreadChatPane
        ref="chatPaneRef"
        :selected-thread-id="selectedThreadId"
        :header-title="headerTitle"
        :header-avatar="headerAvatar"
        :presence-state="presenceState"
        :thread-search-query="threadSearchQuery"
        :search-active="searchActive"
        :displayed-timeline="displayedTimeline"
        :loading="loading"
        :content="content"
        :sending="sending"
        :selected-images="selectedImages"
        :replying-to="replyingTo"
        :is-dragging="isDragging"
        :current-user-id="currentUserId"
        :parse-message-content="parseMessageContent"
        @back="selectedThreadId = ''"
        @search="searchWithinThread"
        @clear-search="searchActive = false; threadSearchQuery = ''; searchResults = []"
        @update:thread-search-query="threadSearchQuery = $event"
        @reply="replyingTo = $event"
        @delete="deleteMessage"
        @mark-read="markAsRead"
        @scroll-images="scrollChatToBottom"
        @report="reportUser"
        @block="blockUser"
        @update:content="content = $event"
        @send="sendMessage"
        @typing="onUserTyping"
        @image-select="handleImageSelect"
        @clear-images="clearSelectedImages"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      />
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Messages</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button type="button" class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style src="../styles/MessagesView.css"></style>
