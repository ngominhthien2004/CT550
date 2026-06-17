<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useChatStore } from '../stores/chat.store'

const chatStore = useChatStore()
const userInput = ref('')
const chatContainer = ref(null)
const isNavCollapsed = ref(false)
const isSending = ref(false)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

const suggestedPrompts = [
  { icon: '🔍', label: 'Tìm artwork', prompt: 'Tìm artwork về phong cảnh thiên nhiên' },
  { icon: '💡', label: 'Gợi ý cho tôi', prompt: 'Gợi ý cho tôi artwork hay về fantasy' },
  { icon: '🎨', label: 'Hỏi về nghệ thuật', prompt: 'Cho tôi hỏi về phong cách vẽ manga' },
  { icon: '📝', label: 'Tóm tắt', prompt: 'Hãy tóm tắt một artwork bất kỳ cho tôi' },
]

onMounted(() => {
  chatStore.addWelcomeMessage()
})

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

watch(
  () => chatStore.isLoading,
  (loading) => {
    isSending.value = loading
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
  isSending.value = true

  try {
    await chatStore.sendMessage(text)
  } finally {
    isSending.value = false
  }
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

function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${d.toLocaleDateString('vi-VN')} ${time}`
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="chat-page">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <h1 class="h4 mb-0">
            <span class="ai-icon">🤖</span>
            AI Assistant
          </h1>
          <p class="text-muted small mb-0">
            Trợ lý thông minh cho IlluWrl — tìm kiếm, gợi ý và tóm tắt artwork
          </p>
        </div>
        <div class="chat-header-actions">
          <button
            v-if="chatStore.hasMessages"
            class="btn btn-outline-secondary btn-sm"
            @click="chatStore.clearConversation(); chatStore.addWelcomeMessage()"
            title="New conversation"
          >
            <i class="fas fa-plus"></i> New Chat
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="chat-body" ref="chatContainer">
        <!-- Welcome / messages -->
        <div
          v-for="(msg, index) in chatStore.messages"
          :key="index"
          :class="['message', msg.role === 'user' ? 'message-user' : 'message-assistant']"
        >
          <div class="message-avatar">
            <span v-if="msg.role === 'user'" class="avatar-user">👤</span>
            <span v-else class="avatar-ai">🤖</span>
          </div>
          <div :class="['message-content', { 'message-error': msg.isError, 'message-welcome': msg.isWelcome }]">
            <div class="message-bubble">
              <div class="message-text" v-html="msg.content.replace(/\n/g, '<br>')"></div>
              <div class="message-meta">
                <span class="message-time">{{ formatTimestamp(msg.timestamp) }}</span>
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

      <!-- Suggested prompts (only show when no messages or few messages) -->
      <div v-if="chatStore.messages.length <= 1 && !chatStore.isLoading" class="suggested-prompts">
        <p class="text-muted small mb-2">Gợi ý nhanh:</p>
        <div class="prompt-chips">
          <button
            v-for="(prompt, index) in suggestedPrompts"
            :key="index"
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
          ></textarea>
          <button
            class="btn btn-primary send-btn"
            @click="sendMessage"
            :disabled="!userInput.trim() || chatStore.isLoading"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
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

.chat-header-info h1 {
  font-weight: 600;
}

.ai-icon {
  margin-right: 0.25rem;
}

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
  background: #f0f0f0;
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
  background: var(--brand, #4361ee);
  color: #fff;
  border-bottom-right-radius: 0.25rem;
}

.message-assistant .message-bubble {
  background: #f0f2f5;
  color: #1a1a1a;
  border-bottom-left-radius: 0.25rem;
}

.message-error .message-bubble {
  background: #fff0f0;
  color: #c00;
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
  background: #999;
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-0.375rem);
  }
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
  border: 1px solid var(--border-color, #ddd);
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: var(--brand, #4361ee);
  box-shadow: 0 0 0 0.125rem rgba(67, 97, 238, 0.15);
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
@media (max-width: 576px) {
  .chat-page {
    height: calc(100vh - 100px);
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
</style>