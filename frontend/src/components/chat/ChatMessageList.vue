<template>
  <div class="chat-body" ref="chatBodyRef" @scroll="$emit('scroll')">
    <!-- Welcome Screen -->
    <div v-if="showWelcome" class="welcome-screen">
      <h2 class="welcome-heading">Xin chào!</h2>
      <p class="welcome-desc">Tôi là trợ lý AI của IlluWrl. Hỏi tôi bất cứ điều gì!</p>

      <div class="feature-cards">
        <div
          v-for="(feature, idx) in welcomeFeatures"
          :key="feature.title"
          class="feature-card"
          :style="{ animationDelay: `${idx * 0.05}s` }"
          @click="$emit('quick-prompt', feature.title)"
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
    <template v-if="messages.length > 0">
      <template v-for="item in messages" :key="item.key || item._id || item.content">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="13" rx="2"></rect>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
                <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
                <path d="M9 14.5c0 0.8 1 1.5 3 1.5s3-0.7 3-1.5"></path>
                <rect x="9" y="2" width="6" height="3" rx="1"></rect>
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
                  @click="$emit('copy', item.content)"
                  title="Sao chép"
                  aria-label="Sao chép nội dung"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    <div v-if="isStreaming && streamingMessage" class="message message-assistant streaming-message">
      <div class="message-avatar">
        <div class="avatar-ai">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="13" rx="2"></rect>
            <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
            <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
            <path d="M9 14.5c0 0.8 1 1.5 3 1.5s3-0.7 3-1.5"></path>
            <rect x="9" y="2" width="6" height="3" rx="1"></rect>
          </svg>
        </div>
      </div>
      <div class="message-content">
        <div class="message-bubble">
          <div class="message-text message-text-ai" v-html="renderMarkdown(streamingMessage)"></div>
          <div class="streaming-cursor" v-if="isStreaming"></div>
        </div>
      </div>
    </div>

    <!-- Typing Indicator -->
    <div v-if="isSending && !isStreaming" class="message message-assistant">
      <div class="message-avatar">
        <div class="avatar-ai">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="13" rx="2"></rect>
            <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
            <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
            <path d="M9 14.5c0 0.8 1 1.5 3 1.5s3-0.7 3-1.5"></path>
            <rect x="9" y="2" width="6" height="3" rx="1"></rect>
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

    <!-- Empty state -->
    <div v-if="messages.length === 0 && !showWelcome" class="chat-empty-state">
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
        @click="$emit('quick-prompt', prompt.prompt)"
      >
        <span class="prompt-chip-icon">{{ prompt.icon }}</span>
        <span class="prompt-chip-label">{{ prompt.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  breaks: true,
  gfm: true,
})

defineProps({
  messages: { type: Array, default: () => [] },
  showWelcome: { type: Boolean, default: false },
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  streamingMessage: { type: String, default: '' },
  welcomeFeatures: { type: Array, default: () => [] }
})

defineEmits(['quick-prompt', 'copy', 'scroll'])

const chatBodyRef = ref(null)

const suggestedPrompts = [
  { icon: '🔍', label: 'Tìm artwork', prompt: 'Tìm artwork về phong cảnh thiên nhiên' },
  { icon: '👤', label: 'Tìm user', prompt: 'Tìm user có tên là minh' },
  { icon: '💡', label: 'Gợi ý cho tôi', prompt: 'Gợi ý cho tôi artwork hay về fantasy' },
  { icon: '🎨', label: 'Hỏi về nghệ thuật', prompt: 'Cho tôi hỏi về phong cách vẽ manga' },
]

function renderMarkdown(text) {
  if (!text) return ''
  const rawHtml = marked.parse(text)
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

defineExpose({ chatBodyRef })
</script>

<style scoped>
/* ═══════════════════════════════════════
   CHAT BODY
   ═══════════════════════════════════════ */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.chat-body::-webkit-scrollbar {
  width: 4px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-body::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 4px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.chat-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.empty-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  padding: 1rem;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.welcome-heading {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.25rem;
  background: linear-gradient(135deg, var(--accent), #0078d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-desc {
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0 0 1rem;
  max-width: 300px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem;
  width: 100%;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.2s ease;
  animation: cardFadeIn 0.4s ease-out both;
  text-align: left;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: var(--accent);
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.feature-card-icon {
  font-size: 1rem;
  flex-shrink: 0;
  line-height: 1;
}

.feature-card-text {
  flex: 1;
  min-width: 0;
}

.feature-card-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1px;
  line-height: 1.2;
}

.feature-card-desc {
  font-size: 0.6rem;
  color: var(--muted);
  line-height: 1.3;
  display: none;
}

/* ═══════════════════════════════════════
   DATE SEPARATOR
   ═══════════════════════════════════════ */
.date-separator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  user-select: none;
}

.date-separator-line {
  flex: 1;
  height: 1px;
  background: var(--line);
}

.date-separator-text {
  font-size: 0.62rem;
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

/* ═══════════════════════════════════════
   MESSAGES
   ═══════════════════════════════════════ */
.message {
  display: flex;
  gap: 0.5rem;
  max-width: 90%;
  animation: messageSlideIn 0.3s ease-out both;
}

@keyframes messageSlideIn {
  from { opacity: 0; transform: translateY(6px); }
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
  width: 24px;
  height: 24px;
  margin-top: 2px;
}

.avatar-ai {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #0078d4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 150, 250, 0.25);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.message-bubble {
  padding: 0.5rem 0.75rem;
  border-radius: 14px;
  font-size: 0.8rem;
  line-height: 1.55;
  word-break: break-word;
  position: relative;
}

.message-user .message-bubble {
  background: linear-gradient(135deg, var(--accent), #0078d4);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 150, 250, 0.2);
}

.message-assistant .message-bubble {
  background: var(--surface-alt);
  color: var(--text);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--line);
}

.is-error .message-bubble {
  background: rgba(239, 68, 68, 0.08) !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
  color: var(--danger) !important;
}

.is-error .message-text-ai {
  color: var(--danger);
}

.is-welcome .message-bubble {
  background: linear-gradient(135deg, var(--accent), #0078d4) !important;
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
  line-height: 1.6;
}

.message-text-ai :deep(p) {
  margin: 0 0 0.4rem;
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
  margin: 0.2rem 0;
  padding-left: 1.1rem;
}

.message-text-ai :deep(li) {
  margin-bottom: 0.1rem;
}

.message-text-ai :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 0.6rem;
  margin: 0.4rem 0;
  color: var(--muted);
  font-style: italic;
}

.message-text-ai :deep(h1),
.message-text-ai :deep(h2),
.message-text-ai :deep(h3),
.message-text-ai :deep(h4) {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0.5rem 0 0.25rem;
  color: var(--text);
}

.message-text-ai :deep(hr) {
  border: none;
  border-top: 1px solid var(--line);
  margin: 0.5rem 0;
}

.message-text-ai :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.4rem 0;
  font-size: 0.72rem;
}

.message-text-ai :deep(th),
.message-text-ai :deep(td) {
  border: 1px solid var(--line);
  padding: 0.25rem 0.5rem;
  text-align: left;
}

.message-text-ai :deep(th) {
  background: var(--surface-alt);
  font-weight: 600;
}

/* Code blocks */
.message-text-ai :deep(pre) {
  margin: 0.4rem 0;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  background: #1a1b26;
  color: #e2e8f0;
  overflow-x: auto;
  font-size: 0.72rem;
  line-height: 1.5;
  position: relative;
  border: 1px solid rgba(255,255,255,0.06);
}

.message-text-ai :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8em;
}

.message-text-ai :deep(p > code),
.message-text-ai :deep(li > code) {
  background: rgba(0, 150, 250, 0.1);
  color: var(--accent);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.8em;
}

.code-copy-btn {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  font-size: 0.65rem;
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
  gap: 0.25rem;
  margin-top: 0.15rem;
}

.message-time {
  font-size: 0.7rem;
  color: var(--muted);
  opacity: 0.8;
}

.message-user .message-footer .message-time {
  color: rgba(255,255,255,0.5);
}

.message-copy-btn {
  width: 24px;
  height: 24px;
  border-radius: 3px;
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
  padding: 0.625rem 1rem !important;
}

.typing-indicator {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.typing-dot {
  width: 6px;
  height: 6px;
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
  30% { transform: translateY(-5px); opacity: 1; }
}

/* ═══════════════════════════════════════
   SUGGESTED PROMPTS
   ═══════════════════════════════════════ */
.suggested-prompts {
  flex-shrink: 0;
  padding: 0 0.625rem 0.375rem;
}

.prompt-chips {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
  flex-wrap: wrap;
}

.prompt-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.625rem;
  border-radius: 100px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: chipFadeIn 0.3s ease-out both;
  white-space: nowrap;
}

@keyframes chipFadeIn {
  from { opacity: 0; transform: translateY(6px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.prompt-chip:hover {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(0, 150, 250, 0.08), rgba(0, 150, 250, 0.05));
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 150, 250, 0.15);
}

.prompt-chip-icon {
  font-size: 0.8rem;
  line-height: 1;
}

.prompt-chip-label {
  font-weight: 500;
}

/* ═══════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════ */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 640px) {
  .feature-cards {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Unscoped: dark theme override for message bubble borders.
     In dark mode --line (#2d3748) equals --surface-alt, so a solid border
     would be invisible. Use a subtle translucent white instead. -->
<style>
:root.dark-theme .message-assistant .message-bubble {
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
