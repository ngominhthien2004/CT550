<script setup>
import { ref } from 'vue'
import { emojiCategories } from '@/constants/emojis'

const props = defineProps({
  content: { type: String, default: '' },
  sending: { type: Boolean, default: false },
  selectedThreadId: { type: String, default: '' },
  selectedImages: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:content', 'send', 'typing', 'image-select', 'clear-images'])

const showEmojiPicker = ref(false)
const activeEmojiTab = ref(0)
const textareaRef = ref(null)
const fileInput = ref(null)

function adjustTextareaHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function openFilePicker() {
  fileInput.value?.click()
}

function insertEmoji(emoji) {
  const textarea = textareaRef.value
  if (!textarea) {
    emit('update:content', props.content + emoji)
    return
  }
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = props.content
  emit('update:content', text.slice(0, start) + emoji + text.slice(end))
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + emoji.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    adjustTextareaHeight()
  }, 0)
}
</script>

<template>
  <form class="compose-row-advanced" @submit.prevent="emit('send')">
    <div class="compose-input-wrapper">
      <textarea
        ref="textareaRef"
        :value="content"
        class="compose-textarea"
        placeholder="Type a message..."
        rows="1"
        :disabled="sending || !selectedThreadId"
        @input="emit('update:content', $event.target.value); emit('typing')"
        @keydown.enter.prevent="e => { if (!e.shiftKey) emit('send') }"
        aria-label="Compose message"
      ></textarea>

      <div class="compose-input-actions">
        <button
          type="button"
          class="icon-btn ghost"
          :class="{ active: showEmojiPicker }"
          :disabled="!selectedThreadId"
          @click="showEmojiPicker = !showEmojiPicker"
          aria-label="Toggle emoji picker"
        >
          <i class="fa-regular fa-face-smile"></i>
        </button>

        <button
          type="button"
          class="icon-btn ghost"
          :disabled="!selectedThreadId"
          @click="openFilePicker"
          aria-label="Add images"
        >
          <i class="fa-regular fa-image" aria-hidden="true"></i>
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          :disabled="!selectedThreadId"
          class="hidden-file-input"
          aria-label="Upload images"
          @change="emit('image-select', $event)"
        />
      </div>

      <div v-if="showEmojiPicker" class="emoji-drawer-panel">
        <div class="emoji-drawer-tabs">
          <button
            v-for="(cat, index) in emojiCategories"
            :key="cat.name"
            type="button"
            class="emoji-tab-btn"
            :class="{ active: activeEmojiTab === index }"
            :title="cat.name"
            @click="activeEmojiTab = index"
          >
            <i :class="cat.icon" aria-hidden="true"></i>
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

    <button
      class="btn btn-primary"
      type="submit"
      :disabled="sending || !selectedThreadId || (!content.trim() && !selectedImages.length)"
    >
      <i class="fa-regular fa-paper-plane" v-if="!sending"></i>
      <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    </button>
  </form>

  <div v-if="selectedImages.length > 0" class="image-summary">
    <span>{{ selectedImages.length === 1 ? selectedImages[0] : `${selectedImages.length} images selected` }}</span>
    <button type="button" @click="emit('clear-images')">Clear</button>
  </div>
</template>

<style scoped>
.compose-row-advanced {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
  background: var(--surface);
  position: relative;
  z-index: 10;
}

.compose-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.compose-textarea {
  width: 100%;
  border: none;
  border-radius: 20px;
  padding: 0.65rem 5.5rem 0.65rem 0.85rem;
  font-size: 0.88rem;
  resize: none;
  min-height: 48px;
  max-height: 120px;
  line-height: 1.4;
  overflow-y: hidden;
  background: var(--surface-alt);
  color: var(--text);
}

.compose-textarea:focus {
  outline: none;
}

.compose-input-actions {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.1rem;
  pointer-events: auto;
}

.compose-input-actions .icon-btn {
  width: 32px;
  height: 32px;
  font-size: 0.95rem;
  color: var(--muted);
}

.compose-input-actions .icon-btn:hover {
  color: var(--text);
}

.compose-input-actions .icon-btn.active {
  color: #6366f1;
}

.compose-input-actions .icon-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.compose-input-actions .icon-btn input {
  display: none;
}

.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.compose-row-advanced .btn-primary {
  min-width: 52px;
  min-height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  padding: 0 0.85rem;
  font-size: 1.1rem;
}

.emoji-drawer-panel {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 300px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 20;
  margin-bottom: 0.5rem;
}

.emoji-drawer-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.emoji-drawer-tabs::-webkit-scrollbar {
  display: none;
}

.emoji-tab-btn {
  border: none;
  background: transparent;
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  color: var(--muted);
  transition: background 0.15s, color 0.15s;
  display: grid;
  place-items: center;
  min-width: 36px;
  min-height: 32px;
}

.emoji-tab-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.emoji-tab-btn.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent);
}

.emoji-drawer-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 2px;
  padding: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.emoji-drawer-list::-webkit-scrollbar {
  width: 5px;
}

.emoji-drawer-list::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-drawer-list::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 4px;
}

.emoji-item-btn {
  border: none;
  background: transparent;
  font-size: 1.35rem;
  padding: 0.35rem;
  cursor: pointer;
  border-radius: 6px;
  display: grid;
  place-items: center;
  transition: background 0.12s, transform 0.12s;
}

.emoji-item-btn:hover {
  background: var(--surface-alt);
  transform: scale(1.15);
}

.image-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--surface-alt);
  border-top: 1px solid var(--line);
  font-size: 0.82rem;
  color: var(--muted);
}

.image-summary button {
  border: none;
  background: transparent;
  color: var(--danger);
  font-size: 0.82rem;
  cursor: pointer;
}
</style>
