<template>
  <div class="chat-input-area">
    <div class="chat-input-wrapper">
      <textarea
        ref="textareaRef"
        :value="userInput"
        @input="$emit('update:user-input', $event.target.value); $emit('input')"
        class="chat-input"
        placeholder="Nhập tin nhắn..."
        rows="1"
        @keydown="$emit('keydown', $event)"
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
          @click="$emit('stop')"
          title="Dừng sinh"
          aria-label="Dừng sinh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
          </svg>
        </button>
        <button
          v-else
          type="button"
          class="send-btn"
          @click="$emit('send')"
          :disabled="!canSend"
          title="Gửi tin nhắn"
          aria-label="Gửi tin nhắn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
    <p class="input-hint">Enter để gửi, Shift+Enter xuống dòng</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  userInput: { type: String, default: '' },
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  characterCount: { type: Number, default: 0 },
  canSend: { type: Boolean, default: false }
})

defineEmits(['update:user-input', 'send', 'stop', 'keydown', 'input'])

const textareaRef = ref(null)

defineExpose({ textareaRef })
</script>

<style scoped>
.chat-input-area {
  flex-shrink: 0;
  padding: 0.375rem 0.625rem 0.5rem;
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.375rem;
  padding: 0.375rem;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface-alt);
  transition: all 0.2s ease;
}

.chat-input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(0, 150, 250, 0.12);
}

.chat-input {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.8rem;
  font-family: inherit;
  line-height: 1.4;
  padding: 0.2rem 0.25rem;
  max-height: 120px;
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
  gap: 0.25rem;
  flex-shrink: 0;
}

.char-count {
  font-size: 0.6rem;
  color: var(--muted);
  font-weight: 500;
  min-width: 16px;
  text-align: center;
}

.char-count-warn {
  color: var(--danger);
}

.send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--accent), #0078d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 150, 250, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(0, 150, 250, 0.4);
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
  width: 32px;
  height: 32px;
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
  font-size: 0.55rem;
  color: var(--muted);
  margin-top: 0.3rem;
  opacity: 0.5;
}
</style>
