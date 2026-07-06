<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useChatStore } from '../stores/chat.store'

import { formatShortDate } from '../utils/date.js'

const chatStore = useChatStore()
const userInput = ref('')
const chatContainer = ref(null)
const isNavCollapsed = ref(false)
const isSessionsOpen = ref(true) // session sidebar open on desktop
const isSending = computed(() => chatStore.isLoading)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function toggleSessions() {
  isSessionsOpen.value = !isSessionsOpen.value
}

const suggestedPrompts = [
  { icon: '🔍', label: 'Tìm artwork', prompt: 'Tìm artwork về phong cảnh thiên nhiên' },
  { icon: '👤', label: 'Tìm user', prompt: 'Tìm user có tên là minh' },
  { icon: '💡', label: 'Gợi ý cho tôi', prompt: 'Gợi ý cho tôi artwork hay về fantasy' },
  { icon: '🎨', label: 'Hỏi về nghệ thuật', prompt: 'Cho tôi hỏi về phong cách vẽ manga' },
]

onMounted(async () => {
  await chatStore.initialize()
})

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isSending.value) return

  userInput.value = ''

  await chatStore.sendMessage(text)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function handleQuickPrompt(prompt) {
  userInput.value = prompt
  sendMessage()
}

async function handleNewChat() {
  await chatStore.createSession()
  await nextTick()
  scrollToBottom()
}

async function handleSelectSession(sessionId) {
  await chatStore.switchSession(sessionId)
  await nextTick()
  scrollToBottom()
}

async function handleDeleteSession(e, sessionId) {
  e.stopPropagation()
  if (confirm('Xóa cuộc trò chuyện này?')) {
    await chatStore.deleteSession(sessionId)
  }
}

function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${formatShortDate(ts)} ${time}`
}

function formatSessionTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString()
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hôm nay, ${time}`
  if (isYesterday) return `Hôm qua, ${time}`
  return formatShortDate(ts)
}

const processedMessages = computed(() =>
  chatStore.messages.map(msg => ({
    ...msg,
    _timestamp: formatTimestamp(msg.createdAt || msg.timestamp),
  }))
)

// Check if we have a session selected
const hasSession = computed(() => !!chatStore.currentSessionId)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="chat-page-layout">
      <!-- Session Sidebar -->
      <div :class="['session-sidebar', { collapsed: !isSessionsOpen }]">
        <div class="session-sidebar-header">
          <h6 class="mb-0 fw-bold">Lịch sử chat</h6>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="handleNewChat" title="New conversation">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="session-list">
          <!-- Loading -->
          <div v-if="chatStore.isSessionsLoading" class="text-center text-muted small py-3">
            <i class="fas fa-spinner fa-spin me-1"></i> Đang tải...
          </div>

          <!-- Empty -->
          <div v-else-if="chatStore.sessions.length === 0" class="text-center text-muted small py-3">
            Chưa có cuộc trò chuyện nào
          </div>

          <!-- Session items -->
          <div
            v-for="session in chatStore.sortedSessions"
            :key="session._id"
            :class="['session-item', { active: session._id === chatStore.currentSessionId }]"
            role="button"
            tabindex="0"
            @click="handleSelectSession(session._id)"
            @keydown.enter="handleSelectSession(session._id)"
          >
            <div class="session-item-content">
              <div class="session-item-title">{{ session.title }}</div>
              <div class="session-item-time">{{ formatSessionTime(session.updatedAt) }}</div>
            </div>
            <button
              class="btn btn-sm btn-outline-danger session-delete-btn"
              @click="handleDeleteSession($event, session._id)"
              title="Xóa"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        <!-- Toggle button at bottom -->
        <button type="button" class="session-toggle-btn" @click="toggleSessions" title="Toggle session list">
          <i :class="isSessionsOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
        </button>
      </div>

      <!-- Main Chat Area -->
      <div class="chat-main">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <button type="button" class="btn btn-sm btn-outline-secondary me-2 d-md-none" @click="toggleSessions">
              <i class="fas fa-history"></i>
            </button>
            <h1 class="h5 mb-0">
              <span class="ai-icon">🤖</span>
              AI Assistant
            </h1>
            <p class="text-muted small mb-0">
              Trợ lý thông minh cho IlluWrl — tìm kiếm, gợi ý và tóm tắt artwork
            </p>
          </div>
          <div class="chat-header-actions">
            <button type="button"
              class="btn btn-outline-secondary btn-sm"
              @click="handleNewChat"
              title="New conversation"
            >
              <i class="fas fa-plus"></i> New Chat
            </button>
          </div>
        </div>

        <!-- No session placeholder -->
        <div v-if="!hasSession" class="no-session-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">🤖</div>
            <h4>Chào bạn!</h4>
            <p class="text-muted">Hãy tạo một cuộc trò chuyện mới để bắt đầu</p>
            <button type="button" class="btn btn-primary" @click="handleNewChat">
              <i class="fas fa-plus me-1"></i> Tạo chat mới
            </button>
          </div>
        </div>

        <!-- Messages -->
        <template v-if="hasSession">
          <div class="chat-body" ref="chatContainer">
            <div
              v-for="(msg, index) in processedMessages"
              :key="'msg-' + index"
              :class="['message', msg.role === 'user' ? 'message-user' : 'message-assistant']"
            >
              <div class="message-avatar">
                <span v-if="msg.role === 'user'" class="avatar-user">👤</span>
                <span v-else class="avatar-ai">🤖</span>
              </div>
              <div :class="['message-content', { 'message-error': msg.isError, 'message-welcome': msg.isWelcome }]">
                <div class="message-bubble">
                  <div class="message-text" v-text="msg.content"></div>
                  <div class="message-meta">
                    <span class="message-time">{{ msg._timestamp }}</span>
                    <span v-if="msg.toolUsed" class="badge bg-info ms-1">Sử dụng công cụ</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="chatStore.isLoading" class="message message-assistant">
              <div class="message-avatar">
                <span class="avatar-ai">🤖</span>
              </div>
              <div class="message-content">
                <div class="message-bubble typing-indicator">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Suggested prompts -->
          <div v-if="!chatStore.isLoading" class="suggested-prompts">
            <p class="text-muted small mb-2">Gợi ý nhanh:</p>
            <div class="prompt-chips">
              <button type="button"
                v-for="prompt in suggestedPrompts"
                :key="prompt.prompt"
                class="btn btn-outline-primary btn-sm prompt-chip"
                @click="handleQuickPrompt(prompt.prompt)"
              >
                <span>{{ prompt.icon }}</span>
                <span>{{ prompt.label }}</span>
              </button>
            </div>
          </div>

          <!-- Input -->
          <div class="chat-input-area">
            <div class="chat-input-wrapper">
              <textarea
                v-model="userInput"
                class="form-control chat-input"
                placeholder="Nhập tin nhắn..."
                rows="1"
                @keydown="handleKeydown"
                :disabled="chatStore.isLoading"
                aria-label="Chat message input"
              ></textarea>
              <button type="button"
                class="btn btn-primary send-btn"
                @click="sendMessage"
                :disabled="!userInput.trim() || chatStore.isLoading"
              >
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
/* ── Layout ── */
.chat-page-layout {
  display: flex;
  height: calc(100vh - 140px);
  gap: 0;
  overflow: hidden;
}

/* ── Session Sidebar ── */
.session-sidebar {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  background: var(--surface, #f8f9fa);
  position: relative;
  transition: width 0.2s, min-width 0.2s;
  overflow: hidden;
}

.session-sidebar.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}

.session-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  flex-shrink: 0;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem;
}

.session-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  gap: 0.5rem;
  transition: background 0.15s;
  margin-bottom: 0.125rem;
}

.session-item:hover {
  background: var(--surface-alt, #e9ecef);
}

.session-item.active {
  background: var(--accent, #4361ee);
  color: #fff;
}

.session-item.active .session-item-time {
  color: rgba(255, 255, 255, 0.75);
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-title {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item-time {
  font-size: 0.65rem;
  opacity: 0.7;
  margin-top: 0.125rem;
}

.session-delete-btn {
  opacity: 0;
  padding: 0.125rem 0.375rem;
  font-size: 0.7rem;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.session-toggle-btn {
  position: absolute;
  right: -2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color, #e0e0e0);
  background: var(--surface, #fff);
  border-radius: 0 0.375rem 0.375rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  font-size: 0.75rem;
  color: var(--muted, #6c757d);
}

/* ── Main Chat Area ── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.chat-header-info h1 {
  font-weight: 600;
}

.ai-icon {
  margin-right: 0.25rem;
}

/* No session placeholder */
.no-session-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  padding: 2rem;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Chat body */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message {
  display: flex;
  gap: 0.625rem;
  max-width: 85%;
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
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.avatar-user,
.avatar-ai {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-user {
  background: var(--brand, #4361ee);
}

.avatar-ai {
  background: var(--surface-alt);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-bubble {
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.message-user .message-bubble {
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 0.25rem;
}

.message-assistant .message-bubble {
  background: var(--surface-alt);
  color: var(--text);
  border-bottom-left-radius: 0.25rem;
}

.message-error .message-bubble {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.message-welcome .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.7;
}

.message-time {
  font-size: 0.65rem;
}

.message-text {
  white-space: pre-wrap;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  align-items: center;
}

.typing-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--muted);
  animation: typing-pulse 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-pulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Suggested prompts */
.suggested-prompts {
  flex-shrink: 0;
  padding: 0.75rem 0;
  text-align: center;
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
  border-radius: 2rem;
  padding: 0.375rem 1rem;
}

/* Input area */
.chat-input-area {
  flex-shrink: 0;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.chat-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  resize: none;
  border-radius: 1.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.9rem;
  border: 1px solid var(--line);
  transition: border-color 0.2s;
  background: var(--surface);
  color: var(--text);
}

.chat-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 0.125rem rgba(0, 150, 250, 0.15);
}

.send-btn {
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .session-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  }

  .session-sidebar.collapsed {
    width: 0;
    min-width: 0;
  }

  .chat-page-layout {
    position: relative;
  }

  .chat-main {
    padding: 0 0.5rem;
  }

  .message {
    max-width: 95%;
  }

  .prompt-chips {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 576px) {
  .chat-page-layout {
    height: calc(100vh - 100px);
  }
}
</style>
