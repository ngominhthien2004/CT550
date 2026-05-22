<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { createMessage, getMyMessages, markMessageRead, userApi } from '../services/api'

const isNavCollapsed = ref(true)
const selectedThreadId = ref('')
const content = ref('')
const profilePreviewName = ref('')
const loading = ref(false)
const error = ref('')
const sending = ref(false)
const selectedImages = ref([])
const threadListRef = ref(null)

const inboxMessages = ref([])
const sentMessages = ref([])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
  return [...inboxMessages.value, ...sentMessages.value].sort(
    (a, b) => getThreadTimestamp(b) - getThreadTimestamp(a),
  )
})

const threads = computed(() => {
  const bucket = new Map()

  allMessages.value.forEach((message) => {
    const isOutgoing = String(message?.sender?._id || '') === currentUserId.value
    const peer = isOutgoing ? message.recipient : message.sender
    const peerId = String(peer?._id || '')

    if (!peerId) {
      return
    }

    if (!bucket.has(peerId)) {
      bucket.set(peerId, {
        peerId,
        peer,
        latestMessage: message,
        unreadCount: 0,
      })
    }

    const current = bucket.get(peerId)
    if (getThreadTimestamp(message) > getThreadTimestamp(current.latestMessage)) {
      current.latestMessage = message
    }

    if (!message.isRead && String(message?.recipient?._id || '') === currentUserId.value) {
      current.unreadCount += 1
    }
  })

  return Array.from(bucket.values()).sort(
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
      return senderId === selectedThreadId.value || recipientId === selectedThreadId.value
    })
    .sort((a, b) => getThreadTimestamp(a) - getThreadTimestamp(b))
})

const threadTimeline = computed(() => {
  const rows = []
  let previousDay = ''

  threadMessages.value.forEach((message) => {
    const day = formatDayLabel(message.createdAt)
    if (day && day !== previousDay) {
      rows.push({
        type: 'day',
        key: `day-${day}`,
        label: day,
      })
      previousDay = day
    }

    rows.push({
      type: 'message',
      key: message._id,
      item: message,
    })
  })

  return rows
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
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load messages'
    inboxMessages.value = []
    sentMessages.value = []
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  const recipientId = activeRecipientId.value
  if (!recipientId) {
    error.value = 'Please choose a conversation first'
    return
  }

  const trimmedContent = content.value.trim()
  const imageOnlyFallback = selectedImages.value.length ? `[Image] ${selectedImages.value.join(', ')}` : ''
  const payloadContent = trimmedContent || imageOnlyFallback

  if (!payloadContent) {
    error.value = 'Please enter a message or choose at least one image'
    return
  }

  sending.value = true
  error.value = ''

  try {
    const { data } = await createMessage({
      recipientId,
      content: payloadContent,
    })

    sentMessages.value = [data, ...sentMessages.value.filter((item) => item._id !== data._id)]
    if (!selectedThreadId.value) {
      selectedThreadId.value = recipientId
    }

    content.value = ''
    selectedImages.value = []
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

watch(
  () => route.query.user,
  async (userId) => {
    if (typeof userId !== 'string' || !userId) {
      return
    }

    selectedThreadId.value = userId
    await loadProfilePreview(userId)
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" class="message-shell page-block">
      <aside class="thread-list-pane">
        <header class="pane-head">
          <div>
            <h1 class="h5 mb-0">Chats</h1>
            <p class="text-secondary mb-0 small">Unread: {{ unreadInboxCount }}</p>
          </div>
          <router-link to="/account" class="pane-link">Message settings</router-link>
        </header>

        <p v-if="loading" class="pane-note">Loading messages...</p>
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
            <div class="thread-avatar">{{ (thread.peer?.username || 'U').charAt(0).toUpperCase() }}</div>
            <div class="thread-meta">
              <div class="thread-top">
                <strong>{{ thread.peer?.displayName || thread.peer?.username || 'Unknown user' }}</strong>
                <small>{{ formatMessageTime(thread.latestMessage.createdAt) }}</small>
              </div>
              <p>{{ thread.latestMessage.content }}</p>
            </div>
            <span v-if="thread.unreadCount" class="thread-badge">{{ thread.unreadCount }}</span>
          </button>
        </div>

        <p v-else class="pane-note">No messages yet.</p>
      </aside>

      <section class="thread-pane">
        <header class="pane-head thread-head">
          <h2 class="h6 mb-0">{{ headerTitle }}</h2>
          <button
            v-if="selectedThreadId"
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="selectedThreadId = ''"
          >
            New chat
          </button>
        </header>

        <div class="thread-body">
          <div v-if="threadTimeline.length" class="message-flow">
            <template v-for="row in threadTimeline" :key="row.key">
              <p v-if="row.type === 'day'" class="day-separator">{{ row.label }}</p>
              <article
                v-else
                class="bubble"
                :class="String(row.item?.sender?._id || '') === currentUserId ? 'outgoing' : 'incoming'"
              >
                <p>{{ row.item.content }}</p>
                <small>{{ formatMessageTime(row.item.createdAt) }}</small>
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

        <form class="compose-row" @submit.prevent="sendMessage">
          <input
            v-model="content"
            class="form-control form-control-sm"
            placeholder="Type a message"
            :disabled="sending || !selectedThreadId"
          />
          <label class="image-picker" :class="{ disabled: !selectedThreadId }" aria-label="Add images">
            <i class="fa-regular fa-image" aria-hidden="true"></i>
            <span>Add images</span>
            <input type="file" multiple accept="image/*" :disabled="!selectedThreadId" @change="handleImageSelect" />
          </label>
          <button class="compose-send" type="submit" :disabled="sending || !selectedThreadId">
            {{ sending ? 'Sending...' : 'Send' }}
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

<style scoped>
.message-shell {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 0;
  min-height: calc(100vh - 110px);
  border: 1px solid #e5eaf1;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.thread-list-pane {
  border-right: 1px solid #eef2f7;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.thread-pane {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.pane-head {
  padding: 0.8rem 0.9rem;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.pane-link {
  font-size: 0.8rem;
  text-decoration: none;
  color: #2563eb;
}

.pane-note {
  margin: 0;
  padding: 0.9rem;
  color: #64748b;
}

.pane-note.error {
  color: #dc2626;
}

.thread-list {
  overflow-y: auto;
  display: block;
}

.thread-item {
  border: 0;
  border-bottom: 1px solid #f2f4f8;
  background: #fff;
  padding: 0.65rem 0.75rem;
  text-align: left;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
}

.thread-item + .thread-item {
  margin-top: 0;
}

.thread-item:hover {
  background: #f8fbff;
}

.thread-item.active {
  background: #eff6ff;
}

.thread-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(135deg, #bfdbfe, #93c5fd);
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.thread-meta {
  min-width: 0;
}

.thread-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.thread-top strong {
  font-size: 0.84rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-top small {
  font-size: 0.68rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.thread-meta p {
  margin: 0.15rem 0 0;
  font-size: 0.76rem;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.thread-badge {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
}

.thread-body {
  overflow-y: auto;
  padding: 1rem 1.1rem;
  background: #f9fbff;
}

.message-flow {
  display: grid;
  gap: 0.62rem;
  align-content: start;
}

.day-separator {
  margin: 0.55rem auto 0.2rem;
  color: #8fa1b8;
  font-size: 0.72rem;
  text-align: center;
}

.bubble {
  max-width: min(78%, 560px);
  border-radius: 12px;
  padding: 0.62rem 0.72rem;
  display: grid;
  gap: 0.22rem;
}

.bubble p {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.35;
}

.bubble small {
  color: #94a3b8;
  font-size: 0.68rem;
  justify-self: end;
}

.bubble.incoming {
  justify-self: start;
  background: #fff;
  border: 1px solid #e5eaf1;
}

.bubble.outgoing {
  justify-self: end;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
}

.mark-read {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 600;
  justify-self: start;
  padding: 0;
}

.compose-row {
  padding: 0.75rem;
  border-top: 1px solid #eef2f7;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.5rem;
  background: #fff;
}

.compose-send {
  border: 1px solid #0d6efd;
  background: #0d6efd;
  color: #fff;
  border-radius: 6px;
  min-width: 92px;
  height: 34px;
  padding: 0 0.85rem;
  font-size: 0.86rem;
  font-weight: 600;
}

.compose-send:disabled {
  opacity: 0.65;
}

.image-picker {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  border: 1px solid #d3dce8;
  background: #fff;
  color: #4b5563;
  border-radius: 6px;
  padding: 0 0.62rem;
  height: 34px;
  font-size: 0.82rem;
  cursor: pointer;
}

.image-picker input {
  display: none;
}

.image-picker.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.image-summary {
  border-top: 1px solid #eef2f7;
  padding: 0.42rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.76rem;
  color: #6b7280;
  background: #fbfdff;
}

.image-summary button {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 600;
}

@media (max-width: 920px) {
  .message-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .thread-list-pane {
    border-right: 0;
    border-bottom: 1px solid #eef2f7;
    max-height: 320px;
  }

  .compose-row {
    grid-template-columns: 1fr;
  }

  .bubble {
    max-width: 92%;
  }
}
</style>
