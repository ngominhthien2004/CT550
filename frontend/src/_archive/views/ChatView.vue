<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { useChatStore } from '../stores/chat.store'
import { formatShortDate } from '../utils/date.js'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

const chatStore = useChatStore()
const userInput = ref('')
const chatContainer = ref(null)
const inputRef = ref(null)
const isNavCollapsed = ref(false)
const isSessionsOpen = ref(true)
const sessionSearch = ref('')
const editingMessageId = ref(null)

const isSending = computed(() => chatStore.isLoading)
const isStreaming = computed(() => chatStore.isStreaming)
const hasSession = computed(() => !!chatStore.currentSessionId)
const showWelcome = computed(() => !chatStore.isLoading && chatStore.messages.length === 0 && !chatStore.streamingMessage)

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

const suggestedPrompts = [
  { icon: '🔍', label: 'Tìm artwork', prompt: 'Tìm artwork về phong cảnh thiên nhiên', desc: 'Khám phá tác phẩm theo chủ đề' },
  { icon: '👤', label: 'Tìm user', prompt: 'Tìm user có tên là minh', desc: 'Kết nối với nghệ sĩ' },
  { icon: '💡', label: 'Gợi ý cho tôi', prompt: 'Gợi ý cho tôi artwork hay về fantasy', desc: 'Cá nhân hóa theo sở thích' },
  { icon: '🎨', label: 'Hỏi về nghệ thuật', prompt: 'Cho tôi hỏi về phong cách vẽ manga', desc: 'Tư vấn kỹ thuật & phong cách' },
]

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

function getSessionStatusClass(session) {
  if (!session.updatedAt) return ''
  const now = Date.now()
  const updated = new Date(session.updatedAt).getTime()
  const diffHours = (now - updated) / 3600000
  if (diffHours < 2) return 'active'
  if (diffHours < 24) return 'recent'
  return ''
}

function formatSessionTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString()
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hôm nay, ${time}`
  if (isYesterday) return `Hôm qua, ${time}`
  return formatShortDate(ts)
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function toggleSessions() {
  isSessionsOpen.value = !isSessionsOpen.value
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
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
  const el = inputRef.value
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

onMounted(async () => {
  await chatStore.initialize()
  await nextTick()
  scrollToBottom()
  if (chatStore.messages.length > 0) {
    await nextTick()
    enhanceCodeBlocks()
  }
})

watch(
  () => chatStore.messages.length,
  async () => {
    if (!autoScrollEnabled) return
    await nextTick()
    scrollToBottom()
    await nextTick()
    enhanceCodeBlocks()
  }
)

watch(
  () => chatStore.streamingMessage,
  async () => {
    if (!autoScrollEnabled) return
    await nextTick()
    scrollToBottom()
  }
)

watch(
  () => chatStore.currentSessionId,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="chat-page-layout">
      <!-- Session Sidebar -->
      <div :class="['session-sidebar', { open: isSessionsOpen }]">
        <div class="sidebar-backdrop-mobile" v-if="isSessionsOpen" @click="toggleSessions"></div>
        <div class="sidebar-inner">
          <div class="sidebar-header">
            <div class="sidebar-header-top">
              <div class="sidebar-title-area">
                <div class="sidebar-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h6 class="sidebar-title">Lịch sử chat</h6>
              </div>
              <button type="button" class="sidebar-new-btn" @click="handleNewChat" title="Tạo chat mới">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button type="button" class="sidebar-close-btn d-lg-none" @click="toggleSessions" title="Đóng">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="sidebar-search">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                v-model="sessionSearch"
                type="text"
                class="search-input"
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm lịch sử chat"
              />
            </div>
          </div>

          <div class="session-list">
            <div v-if="chatStore.isSessionsLoading" class="session-state">
              <div class="spinner"></div>
              <span>Đang tải...</span>
            </div>
            <div v-else-if="filteredSessions.length === 0" class="session-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="session-state-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span v-if="sessionSearch">Không tìm thấy cuộc trò chuyện</span>
              <span v-else>Chưa có cuộc trò chuyện nào</span>
            </div>
            <div
              v-for="session in filteredSessions"
              :key="session._id"
              :class="['session-item', { active: session._id === chatStore.currentSessionId }]"
              role="button"
              tabindex="0"
              @click="handleSelectSession(session._id)"
              @keydown.enter="handleSelectSession(session._id)"
            >
              <div class="session-status-dot" :class="getSessionStatusClass(session)"></div>
              <div class="session-item-content">
                <div class="session-item-title">{{ session.title || 'Cuộc trò chuyện mới' }}</div>
                <div class="session-item-time">{{ formatSessionTime(session.updatedAt) }}</div>
              </div>
              <button
                class="session-delete-btn"
                @click="handleDeleteSession($event, session._id)"
                title="Xóa"
                aria-label="Xóa cuộc trò chuyện"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="sidebar-footer">
            <button type="button" class="sidebar-collapse-btn" @click="toggleSessions" title="Thu gọn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Thu gọn</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Collapse toggle (desktop) -->
      <button
        v-if="!isSessionsOpen"
        type="button"
        class="session-open-btn"
        @click="toggleSessions"
        title="Mở danh sách chat"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <!-- Main Chat Area -->
      <div class="chat-main">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-left">
            <button type="button" class="header-menu-btn d-lg-none" @click="toggleSessions" aria-label="Mở danh sách chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div class="header-info">
              <div class="header-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div class="header-text">
                <h1 class="header-title">AI Assistant</h1>
                <p class="header-subtitle">Trợ lý thông minh IlluWrl</p>
              </div>
            </div>
          </div>
          <div class="chat-header-right">
            <button type="button" class="header-action-btn" @click="handleNewChat" title="Tạo chat mới">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="chat-body" ref="chatContainer" @scroll="handleScroll">
          <!-- Welcome Screen -->
          <div v-if="showWelcome" class="welcome-screen">
            <div class="welcome-logo">
              <div class="welcome-logo-ring"></div>
              <div class="welcome-logo-inner">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 3h-4s-2-1-2-3a4 4 0 0 1 4-4z"></path>
                  <path d="M12 10v4"></path>
                  <path d="M8 14h8"></path>
                  <path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
                </svg>
              </div>
            </div>
            <h2 class="welcome-heading">Xin chào! Tôi là trợ lý AI của IlluWrl</h2>
            <p class="welcome-desc">Khám phá thế giới nghệ thuật với sự giúp đỡ từ trí tuệ nhân tạo</p>

            <div class="feature-cards">
              <div
                v-for="(feature, idx) in welcomeFeatures"
                :key="feature.title"
                class="feature-card"
                :style="{ animationDelay: `${idx * 0.05}s` }"
                @click="handleQuickPrompt(feature.title)"
              >
                <div class="feature-card-icon">{{ feature.icon }}</div>
                <div class="feature-card-text">
                  <div class="feature-card-title">{{ feature.title }}</div>
                  <div class="feature-card-desc">{{ feature.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Date separator + Messages -->
          <template v-if="groupedMessages.length > 0">
            <template v-for="item in groupedMessages" :key="item.key || item._id || item.content">
              <!-- Date separator -->
              <div v-if="item.type === 'date-separator'" class="date-separator">
                <span class="date-separator-line"></span>
                <span class="date-separator-text">{{ item.label }}</span>
                <span class="date-separator-line"></span>
              </div>

              <!-- Message -->
              <div
                v-else
                :class="['message', item.role === 'user' ? 'message-user' : 'message-assistant']"
              >
                <div v-if="item.role !== 'user'" class="message-avatar">
                  <div class="avatar-ai">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
                <div :class="['message-content', { 'is-error': item.isError, 'is-welcome': item.isWelcome }]">
                  <div class="message-bubble">
                    <div v-if="item.role === 'user'" class="message-text message-text-user">
                      {{ item.content }}
                    </div>
                    <div v-else class="message-text message-text-ai" v-html="renderMarkdown(item.content)"></div>
                    <div class="message-footer">
                      <span class="message-time">{{ item._timestamp }}</span>
                      <button
                        v-if="item.role === 'assistant' && item.content"
                        class="message-copy-btn"
                        @click="copyMessageContent(item.content)"
                        title="Sao chép"
                        aria-label="Sao chép nội dung"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- Streaming Message -->
          <div v-if="isStreaming && chatStore.streamingMessage" class="message message-assistant streaming-message">
            <div class="message-avatar">
              <div class="avatar-ai">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div class="message-text message-text-ai" v-html="renderMarkdown(chatStore.streamingMessage)"></div>
                <div class="streaming-cursor" v-if="isStreaming"></div>
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isSending && !isStreaming" class="message message-assistant">
            <div class="message-avatar">
              <div class="avatar-ai">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble typing-bubble">
                <div class="typing-indicator">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state (bottom spacer) -->
          <div v-if="groupedMessages.length === 0 && !showWelcome" class="chat-empty-state">
            <div class="empty-spinner" v-if="isSending">
              <div class="spinner"></div>
            </div>
          </div>
        </div>

        <!-- Suggested Prompts (only at start) -->
        <div v-if="showWelcome && !isSending" class="suggested-prompts">
          <div class="prompt-chips">
            <button
              type="button"
              v-for="(prompt, idx) in suggestedPrompts"
              :key="prompt.prompt"
              class="prompt-chip"
              :style="{ animationDelay: `${0.3 + idx * 0.08}s` }"
              @click="handleQuickPrompt(prompt.prompt)"
            >
              <span class="prompt-chip-icon">{{ prompt.icon }}</span>
              <span class="prompt-chip-label">{{ prompt.label }}</span>
            </button>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="chat-input-area">
          <div class="chat-input-container">
            <div class="chat-input-wrapper">
              <textarea
                ref="inputRef"
                v-model="userInput"
                class="chat-input"
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                rows="1"
                @keydown="handleKeydown"
                @input="autoResize"
                :disabled="isSending && !isStreaming"
                aria-label="Chat message input"
              ></textarea>
              <div class="input-actions">
                <span v-if="characterCount > 0 && characterCount < 500" class="char-count">{{ characterCount }}</span>
                <span v-if="characterCount >= 500" class="char-count char-count-warn">{{ characterCount }}</span>
                <button
                  v-if="isStreaming"
                  type="button"
                  class="stop-btn"
                  @click="stopGeneration"
                  title="Dừng sinh"
                  aria-label="Dừng sinh"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                  </svg>
                </button>
                <button
                  v-else
                  type="button"
                  class="send-btn"
                  @click="sendMessage"
                  :disabled="!canSend"
                  title="Gửi tin nhắn"
                  aria-label="Gửi tin nhắn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
            <p class="input-hint">AI có thể mắc lỗi, hãy kiểm tra thông tin quan trọng</p>
          </div>
        </div>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
/* ═══════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════ */
.chat-page-layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 140px);
  overflow: hidden;
  position: relative;
  background: var(--bg);
  border-radius: var(--radius);
}

/* ═══════════════════════════════════════
   SESSION SIDEBAR
   ═══════════════════════════════════════ */
.session-sidebar {
  flex-shrink: 0;
  width: 300px;
  position: relative;
  z-index: 10;
}

.sidebar-backdrop-mobile {
  display: none;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  border-right: 1px solid var(--line);
  border-radius: var(--radius) 0 0 var(--radius);
  overflow: hidden;
  transition: background 0.3s;
}

.sidebar-header {
  flex-shrink: 0;
  padding: 1rem 0.75rem 0.5rem;
  border-bottom: 1px solid var(--line);
}

.sidebar-header-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.sidebar-title-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.sidebar-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-new-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: var(--surface-alt);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.sidebar-new-btn:hover {
  background: var(--accent);
  color: white;
  transform: scale(1.05);
}

.sidebar-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.sidebar-close-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.sidebar-search {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 32px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.8rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-input::placeholder {
  color: var(--muted);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.session-list::-webkit-scrollbar {
  width: 4px;
}

.session-list::-webkit-scrollbar-track {
  background: transparent;
}

.session-list::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 4px;
}

.session-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--muted);
  font-size: 0.8rem;
}

.session-state-icon {
  opacity: 0.4;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.session-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2px;
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  position: relative;
}

.session-item:hover {
  background: var(--surface-alt);
}

.session-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(124, 58, 237, 0.08));
  border: 1px solid rgba(59, 130, 246, 0.2);
}

:root.dark-theme .session-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(124, 58, 237, 0.1));
  border-color: rgba(59, 130, 246, 0.25);
}

.session-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--muted);
}

.session-status-dot.active {
  background: #22c55e;
}

.session-status-dot.recent {
  background: var(--accent);
}

.session-item.active .session-status-dot {
  background: var(--accent);
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item.active .session-item-title {
  font-weight: 600;
}

.session-item-time {
  font-size: 0.65rem;
  color: var(--muted);
  margin-top: 2px;
}

.session-delete-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.2s;
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.session-delete-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--line);
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-collapse-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

/* Session open button when collapsed */
.session-open-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  width: 28px;
  height: 48px;
  border: 1px solid var(--line);
  border-left: none;
  border-radius: 0 10px 10px 0;
  background: var(--surface);
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 2px 0 8px rgba(0,0,0,0.06);
}

.session-open-btn:hover {
  color: var(--accent);
  background: var(--surface-alt);
}

/* ═══════════════════════════════════════
   CHAT MAIN AREA
   ═══════════════════════════════════════ */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
  position: relative;
}

/* ═══════════════════════════════════════
   CHAT HEADER
   ═══════════════════════════════════════ */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  background: var(--surface);
  border-radius: 0 var(--radius) 0 0;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-menu-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.header-menu-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.header-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.header-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
  line-height: 1.3;
}

.header-subtitle {
  font-size: 0.7rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.3;
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.header-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.header-action-btn:hover {
  background: var(--surface-alt);
  color: var(--accent);
}

/* ═══════════════════════════════════════
   WELCOME SCREEN
   ═══════════════════════════════════════ */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.welcome-logo {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-logo-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2, #ec4899);
  animation: logoPulse 3s ease-in-out infinite;
  opacity: 0.6;
  filter: blur(4px);
}

@keyframes logoPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 0.8; }
}

.welcome-logo-inner {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  z-index: 1;
}

.welcome-heading {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  max-width: 640px;
  width: 100%;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.25s ease;
  animation: cardFadeIn 0.4s ease-out both;
  text-align: left;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent);
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.feature-card-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  line-height: 1;
}

.feature-card-text {
  flex: 1;
  min-width: 0;
}

.feature-card-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.feature-card-desc {
  font-size: 0.68rem;
  color: var(--muted);
  line-height: 1.3;
}

/* ═══════════════════════════════════════
   CHAT BODY & MESSAGES
   ═══════════════════════════════════════ */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.chat-body::-webkit-scrollbar {
  width: 5px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-body::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 10px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.chat-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.empty-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Date Separator */
.date-separator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  user-select: none;
}

.date-separator-line {
  flex: 1;
  height: 1px;
  background: var(--line);
}

.date-separator-text {
  font-size: 0.7rem;
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

/* Message */
.message {
  display: flex;
  gap: 0.625rem;
  max-width: 88%;
  animation: messageSlideIn 0.3s ease-out both;
}

@keyframes messageSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-assistant {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-top: 4px;
}

.avatar-ai {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.message-bubble {
  padding: 0.625rem 1rem;
  border-radius: 16px;
  font-size: 0.875rem;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}

.message-user .message-bubble {
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.message-assistant .message-bubble {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--line);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
}

:root.dark-theme .message-assistant .message-bubble {
  background: var(--surface-alt);
  border-color: transparent;
}

.is-error .message-bubble {
  background: rgba(239, 68, 68, 0.08) !important;
  border-color: rgba(239, 68, 68, 0.2) !important;
  color: var(--danger) !important;
}

.is-error .message-text-ai {
  color: var(--danger);
}

.is-welcome .message-bubble {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  color: white !important;
  border: none !important;
}

.message-text {
  white-space: pre-wrap;
}

.message-text-user {
  white-space: pre-wrap;
}

.message-text-ai {
  line-height: 1.65;
}

.message-text-ai :deep(p) {
  margin: 0 0 0.5rem;
}

.message-text-ai :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text-ai :deep(strong) {
  font-weight: 600;
}

.message-text-ai :deep(em) {
  font-style: italic;
}

.message-text-ai :deep(a) {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.message-text-ai :deep(a:hover) {
  border-bottom-color: var(--accent);
}

.message-text-ai :deep(ul),
.message-text-ai :deep(ol) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}

.message-text-ai :deep(li) {
  margin-bottom: 0.125rem;
}

.message-text-ai :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: var(--muted);
  font-style: italic;
}

.message-text-ai :deep(h1),
.message-text-ai :deep(h2),
.message-text-ai :deep(h3),
.message-text-ai :deep(h4) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.375rem;
  color: var(--text);
}

.message-text-ai :deep(hr) {
  border: none;
  border-top: 1px solid var(--line);
  margin: 0.75rem 0;
}

.message-text-ai :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
  font-size: 0.8rem;
}

.message-text-ai :deep(th),
.message-text-ai :deep(td) {
  border: 1px solid var(--line);
  padding: 0.375rem 0.625rem;
  text-align: left;
}

.message-text-ai :deep(th) {
  background: var(--surface-alt);
  font-weight: 600;
}

/* Code blocks */
.message-text-ai :deep(pre) {
  margin: 0.5rem 0;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  background: #1a1b26;
  color: #e2e8f0;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.5;
  position: relative;
  border: 1px solid rgba(255,255,255,0.06);
}

:root.dark-theme .message-text-ai :deep(pre) {
  background: #0d1117;
  border-color: rgba(255,255,255,0.04);
}

.message-text-ai :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8em;
}

.message-text-ai :deep(p > code),
.message-text-ai :deep(li > code) {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.8em;
}

:root.dark-theme .message-text-ai :deep(p > code),
:root.dark-theme .message-text-ai :deep(li > code) {
  background: rgba(59, 130, 246, 0.15);
}

/* Code block copy button */
.code-copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.message-text-ai :deep(pre:hover .code-copy-btn) {
  opacity: 1;
}

.code-copy-btn:hover,
.code-copy-btn.copied {
  opacity: 1;
  background: rgba(255,255,255,0.12);
  color: white;
}

.code-copy-btn.copied {
  color: #22c55e;
}

/* Message footer */
.message-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
  margin-top: 0.25rem;
}

.message-time {
  font-size: 0.62rem;
  color: var(--muted);
  opacity: 0.7;
}

.message-user .message-footer .message-time {
  color: rgba(255,255,255,0.6);
}

.message-copy-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.message-content:hover .message-copy-btn {
  opacity: 1;
}

.message-copy-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

/* Streaming message */
.streaming-message {
  animation: none;
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: cursorBlink 0.8s step-end infinite;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ═══════════════════════════════════════
   TYPING INDICATOR
   ═══════════════════════════════════════ */
.typing-bubble {
  padding: 0.75rem 1.125rem !important;
}

.typing-indicator {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ═══════════════════════════════════════
   SUGGESTED PROMPTS
   ═══════════════════════════════════════ */
.suggested-prompts {
  flex-shrink: 0;
  padding: 0 1.25rem 0.5rem;
}

.prompt-chips {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.prompt-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 100px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.25s ease;
  animation: chipFadeIn 0.3s ease-out both;
  white-space: nowrap;
}

@keyframes chipFadeIn {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.prompt-chip:hover {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(124, 58, 237, 0.05));
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.prompt-chip-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.prompt-chip-label {
  font-weight: 500;
}

/* ═══════════════════════════════════════
   CHAT INPUT
   ═══════════════════════════════════════ */
.chat-input-area {
  flex-shrink: 0;
  padding: 0.5rem 1.25rem 1rem;
  background: var(--surface);
  border-radius: 0 0 var(--radius) var(--radius);
  border-top: 1px solid var(--line);
}

.chat-input-container {
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface-alt);
  transition: all 0.25s ease;
}

.chat-input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12), var(--shadow-sm);
}

:root.dark-theme .chat-input-wrapper:focus-within {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.chat-input {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  padding: 0.25rem 0.375rem;
  max-height: 200px;
  outline: none;
}

.chat-input::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.char-count {
  font-size: 0.65rem;
  color: var(--muted);
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.char-count-warn {
  color: var(--danger);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}

.stop-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--danger);
  background: transparent;
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.stop-btn:hover {
  background: var(--danger);
  color: white;
  transform: scale(1.05);
}

.input-hint {
  text-align: center;
  font-size: 0.65rem;
  color: var(--muted);
  margin-top: 0.5rem;
  opacity: 0.6;
}

/* ═══════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════ */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ═══════════════════════════════════════
   RESPONSIVE — TABLET
   ═══════════════════════════════════════ */
@media (max-width: 992px) {
  .chat-page-layout {
    height: calc(100vh - 100px);
  }

  .session-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 300px;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1050;
  }

  .session-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-backdrop-mobile {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: -1;
  }

  .sidebar-close-btn {
    display: flex;
  }

  .sidebar-inner {
    border-radius: 0;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  }

  .chat-header {
    border-radius: 0;
  }

  .chat-main {
    max-width: 100%;
  }
}

/* ═══════════════════════════════════════
   RESPONSIVE — MOBILE
   ═══════════════════════════════════════ */
@media (max-width: 640px) {
  .chat-page-layout {
    height: calc(100vh - 80px);
  }

  .session-sidebar {
    width: 100%;
  }

  .chat-main {
    max-width: 100%;
  }

  .chat-header {
    padding: 0.625rem 0.75rem;
  }

  .chat-body {
    padding: 0.75rem 0.875rem;
  }

  .message {
    max-width: 95%;
  }

  .message-bubble {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .welcome-screen {
    padding: 1.5rem 1rem;
  }

  .feature-cards {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .feature-card {
    padding: 0.625rem;
  }

  .feature-card-title {
    font-size: 0.72rem;
  }

  .feature-card-desc {
    display: none;
  }

  .welcome-heading {
    font-size: 1.1rem;
  }

  .suggested-prompts {
    padding: 0 0.875rem 0.375rem;
  }

  .prompt-chip {
    padding: 0.375rem 0.75rem;
    font-size: 0.72rem;
  }

  .chat-input-area {
    padding: 0.375rem 0.75rem 0.75rem;
  }

  .chat-input-wrapper {
    border-radius: 12px;
    padding: 0.375rem;
  }

  .chat-input {
    font-size: 0.85rem;
  }

  .send-btn,
  .stop-btn {
    width: 32px;
    height: 32px;
  }

  .input-hint {
    font-size: 0.6rem;
  }

  .header-title {
    font-size: 0.88rem;
  }

  .session-open-btn {
    display: none;
  }
}

/* ═══════════════════════════════════════
   RESPONSIVE — VERY SMALL
   ═══════════════════════════════════════ */
@media (max-width: 400px) {
  .feature-cards {
    grid-template-columns: 1fr;
  }

  .prompt-chips {
    flex-direction: column;
    align-items: stretch;
  }

  .prompt-chip {
    justify-content: center;
  }
}
</style>
