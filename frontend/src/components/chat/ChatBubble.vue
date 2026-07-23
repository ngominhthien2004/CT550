<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useChatStore } from '../../stores/chat.store'
import { formatShortDate } from '../../utils/date.js'
import { useAgentExecutor } from '../../composables/useAgentExecutor'
import ChatPanelHeader from './ChatPanelHeader.vue'
import ChatSessionSidebar from './ChatSessionSidebar.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useChatStore()
const { execute } = useAgentExecutor()
const userInput = ref('')
const inputRef = ref(null)
const isSessionsOpen = ref(false)
const sessionSearch = ref('')
const editingMessageId = ref(null)
const initialized = ref(false)

const messageListRef = ref(null)
const chatInputRef = ref(null)

const chatContainer = computed(() => messageListRef.value?.chatBodyRef || null)

const isSending = computed(() => chatStore.isLoading)
const isStreaming = computed(() => chatStore.isStreaming)
const hasSession = computed(() => !!chatStore.currentSessionId)
const showWelcome = computed(() => !chatStore.isLoading && chatStore.messages.length === 0 && !chatStore.streamingMessage)
const unreadCount = computed(() => {
  if (!chatStore.messages.length || chatStore.bubbleOpen) return 0
  const last = chatStore.messages[chatStore.messages.length - 1]
  return last && last.role === 'assistant' ? 1 : 0
})

const filteredSessions = computed(() => {
  if (!sessionSearch.value.trim()) return chatStore.sortedSessions
  const q = sessionSearch.value.toLowerCase()
  return chatStore.sortedSessions.filter(s =>
    s.title.toLowerCase().includes(q)
  )
})

const groupedMessages = computed(() => {
  const result = []
  let lastDate = null
  for (const msg of chatStore.messages) {
    const msgDate = msg.createdAt || msg.timestamp
    if (!msgDate) {
      result.push({ type: 'message', ...msg, _timestamp: '' })
      continue
    }
    const d = new Date(msgDate)
    if (isNaN(d.getTime())) {
      result.push({ type: 'message', ...msg, _timestamp: '' })
      continue
    }
    const dateStr = d.toDateString()
    if (dateStr !== lastDate) {
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      let label
      if (dateStr === today) label = 'Hôm nay'
      else if (dateStr === yesterday) label = 'Hôm qua'
      else label = formatShortDate(msgDate)
      result.push({ type: 'date-separator', label, key: 'sep-' + dateStr })
      lastDate = dateStr
    }
    result.push({
      type: 'message',
      ...msg,
      _timestamp: formatChatTimestamp(msgDate),
    })
  }
  return result
})

const characterCount = computed(() => userInput.value.length)
const canSend = computed(() => userInput.value.trim().length > 0 && !isSending.value)

const welcomeFeatures = [
  { icon: '🔍', title: 'Tìm kiếm artwork', desc: 'Tra cứu tác phẩm theo từ khóa, thể loại, màu sắc' },
  { icon: '💡', title: 'Gợi ý tác phẩm', desc: 'Nhận đề xuất artwork dựa trên sở thích của bạn' },
  { icon: '📝', title: 'Tóm tắt nội dung', desc: 'Tóm tắt chi tiết và cảm nhận về artwork' },
  { icon: '🎨', title: 'Tư vấn nghệ thuật', desc: 'Hỏi về kỹ thuật vẽ, phong cách & hội họa' },
  { icon: '👤', title: 'Tìm kiếm người dùng', desc: 'Khám phá nghệ sĩ và cộng đồng IlluWrl' },
  { icon: '📋', title: 'Commission plan', desc: 'Tìm kiếm gói commission phù hợp' },
]

function formatChatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${formatShortDate(ts)} ${time}`
}

function toggleSessions() {
  isSessionsOpen.value = !isSessionsOpen.value
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function enhanceCodeBlocks() {
  if (!chatContainer.value) return
  chatContainer.value.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.code-copy-btn')) return
    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'
    pre.parentNode.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const btn = document.createElement('button')
    btn.className = 'code-copy-btn'
    btn.setAttribute('aria-label', 'Copy code')
    btn.innerHTML = '<i class="fa-regular fa-copy"></i>'
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const code = pre.querySelector('code')
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(() => {
          btn.innerHTML = '<i class="fa-solid fa-check"></i>'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>'
            btn.classList.remove('copied')
          }, 2000)
        }).catch(() => {
          btn.innerHTML = '<i class="fa-solid fa-xmark"></i>'
          setTimeout(() => {
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>'
          }, 2000)
        })
      }
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
}

let autoScrollEnabled = true

function handleScroll() {
  if (!chatContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = chatContainer.value
  autoScrollEnabled = scrollHeight - scrollTop - clientHeight < 80
}

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isSending.value) return

  userInput.value = ''
  autoScrollEnabled = true

  await chatStore.sendMessageStream(text)
  await nextTick()
  enhanceCodeBlocks()
  scrollToBottom()
}

function stopGeneration() {
  chatStore.stopGeneration()
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function autoResize() {
  const el = chatInputRef.value?.textareaRef
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }
}

function handleQuickPrompt(prompt) {
  userInput.value = prompt
  sendMessage()
}

async function handleNewChat() {
  isSessionsOpen.value = false
  await chatStore.createSession()
  await nextTick()
  scrollToBottom()
}

async function handleSelectSession(sessionId) {
  await chatStore.switchSession(sessionId)
  isSessionsOpen.value = false
  await nextTick()
  scrollToBottom()
}

async function handleDeleteSession(e, sessionId) {
  e.stopPropagation()
  if (confirm('Xóa cuộc trò chuyện này?')) {
    await chatStore.deleteSession(sessionId)
  }
}

function copyMessageContent(content) {
  navigator.clipboard.writeText(content).then(() => {
    editingMessageId.value = 'copied'
    setTimeout(() => { editingMessageId.value = null }, 2000)
  })
}

async function openChat() {
  chatStore.openBubble()
  if (!initialized.value) {
    await chatStore.initialize()
    initialized.value = true
  }
  await nextTick()
  scrollToBottom()
  if (chatStore.messages.length > 0) {
    enhanceCodeBlocks()
  }
  if (chatInputRef.value?.textareaRef) {
    chatInputRef.value.textareaRef.focus()
  }
}

async function retryChatLoad() {
  await chatStore.retryLoad()
  await nextTick()
  scrollToBottom()
}

function closeChat() {
  chatStore.closeBubble()
}

function minimizeChat() {
  chatStore.closeBubble()
}

function handleKeyEscape(e) {
  if (e.key === 'Escape' && chatStore.bubbleOpen) {
    closeChat()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeyEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyEscape)
})

watch(
  () => chatStore.messages.length,
  async () => {
    if (!autoScrollEnabled || !chatStore.bubbleOpen) return
    await nextTick()
    scrollToBottom()
    await nextTick()
    enhanceCodeBlocks()
  }
)

watch(
  () => chatStore.streamingMessage,
  async () => {
    if (!autoScrollEnabled || !chatStore.bubbleOpen) return
    await nextTick()
    scrollToBottom()
  }
)

watch(
  () => chatStore.currentSessionId,
  async () => {
    if (!chatStore.bubbleOpen) return
    await nextTick()
    scrollToBottom()
  }
)

watch(() => chatStore.bubbleOpen, async (val) => {
  if (val) {
    await nextTick()
    scrollToBottom()
    if (chatContainer.value && chatStore.messages.length > 0) {
      enhanceCodeBlocks()
    }
  }
})

// Watch for agent actions from AI
watch(
  () => chatStore.pendingActions.length,
  (newLen, oldLen) => {
    if (newLen > 0) {
      const action = chatStore.dequeueAction()
      if (action) {
        execute(action)
      }
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="chat-panel">
      <div v-if="chatStore.bubbleOpen" class="chat-bubble-overlay">
          <div class="chat-bubble-backdrop" @click="closeChat"></div>

          <div class="chat-bubble-panel">
            <ChatPanelHeader
              @new-chat="handleNewChat"
              @minimize="minimizeChat"
              @close="closeChat"
              @toggle-sidebar="toggleSessions"
              :is-sessions-open="isSessionsOpen"
            />

            <div class="panel-body">
              <ChatSessionSidebar
                :is-open="isSessionsOpen"
                :sessions="filteredSessions"
                :current-id="chatStore.currentSessionId"
                :is-loading="chatStore.isSessionsLoading"
                :search="sessionSearch"
                @update:search="sessionSearch = $event"
                @select="handleSelectSession"
                @delete="handleDeleteSession"
              />

              <div class="panel-chat">
                <div v-if="chatStore.loadError" class="chat-error-banner" role="alert">
                  <span class="chat-error-banner-text">{{ chatStore.loadError }}</span>
                  <button type="button" class="chat-error-banner-retry" @click="retryChatLoad">
                    <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                    Retry
                  </button>
                </div>

                <ChatMessageList
                  ref="messageListRef"
                  :messages="groupedMessages"
                  :show-welcome="showWelcome"
                  :is-sending="isSending"
                  :is-streaming="isStreaming"
                  :streaming-message="chatStore.streamingMessage"
                  :welcome-features="welcomeFeatures"
                  @quick-prompt="handleQuickPrompt"
                  @copy="copyMessageContent"
                  @scroll="handleScroll"
                />

                <ChatInput
                  ref="chatInputRef"
                  :user-input="userInput"
                  @update:user-input="userInput = $event"
                  :is-sending="isSending"
                  :is-streaming="isStreaming"
                  :character-count="characterCount"
                  :can-send="canSend"
                  @send="sendMessage"
                  @stop="stopGeneration"
                  @keydown="handleKeydown"
                  @input="autoResize"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
</template>

<style scoped>
/* ═══════════════════════════════════════
   PANEL OVERLAY
   ═══════════════════════════════════════ */
.chat-bubble-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.chat-bubble-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: all;
  display: none;
}

/* Panel transition */
.chat-panel-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-panel-leave-active {
  transition: all 0.25s ease-in;
}
.chat-panel-enter-from {
  opacity: 0;
}
.chat-panel-enter-from .chat-bubble-panel {
  transform: translateY(20px) scale(0.95);
}
.chat-panel-leave-to {
  opacity: 0;
}
.chat-panel-leave-to .chat-bubble-panel {
  transform: translateY(20px) scale(0.95);
}

/* ═══════════════════════════════════════
   PANEL
   ═══════════════════════════════════════ */
.chat-bubble-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 420px;
  height: 600px;
  max-height: calc(100vh - 120px);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
  z-index: 10000;
  pointer-events: all;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

/* ═══════════════════════════════════════
   PANEL BODY (sidebar + chat)
   ═══════════════════════════════════════ */
.panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ═══════════════════════════════════════
   CHAT AREA (inside panel)
   ═══════════════════════════════════════ */
.panel-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* Error banner: surfaces load failures so the user can retry. */
.chat-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  margin: 0.5rem 0.75rem 0;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #b91c1c;
  font-size: 0.82rem;
  line-height: 1.4;
}

:root.dark-theme .chat-error-banner {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.4);
  color: #fca5a5;
}

.chat-error-banner-text {
  flex: 1;
  word-break: break-word;
}

.chat-error-banner-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.chat-error-banner-retry:hover {
  background: currentColor;
}

.chat-error-banner-retry:hover > * {
  color: var(--surface);
}

/* ═══════════════════════════════════════
   RESPONSIVE — TABLET
   ═══════════════════════════════════════ */
@media (max-width: 768px) {
  .chat-bubble-panel {
    right: 8px;
    bottom: 88px;
    width: calc(100vw - 16px);
    height: calc(100vh - 100px);
    max-height: none;
    border-radius: 14px;
  }
}

/* ═══════════════════════════════════════
   RESPONSIVE — MOBILE (full screen)
   ═══════════════════════════════════════ */
@media (max-width: 640px) {
  .chat-bubble-backdrop {
    display: block;
    pointer-events: all;
  }

  .chat-bubble-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: none;
    border-radius: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
