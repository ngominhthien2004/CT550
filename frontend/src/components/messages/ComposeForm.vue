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

function adjustTextareaHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
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
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
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

        <label class="icon-btn ghost" :class="{ disabled: !selectedThreadId }" aria-label="Add images">
          <i class="fa-regular fa-image" aria-hidden="true"></i>
          <input type="file" multiple accept="image/*" :disabled="!selectedThreadId" aria-label="Upload images" @change="emit('image-select', $event)" />
        </label>
      </div>

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
  border-top: 1px solid #e5e7eb;
  background: #fff;
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
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
  z-index: 20;
  margin-bottom: 0.5rem;
}

.emoji-drawer-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  overflow-x: auto;
}

.emoji-tab-btn {
  border: none;
  background: transparent;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  color: #6b7280;
}

.emoji-tab-btn.active {
  background: #eef2ff;
  color: #6366f1;
  font-weight: 600;
}

.emoji-drawer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item-btn {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  padding: 0.3rem;
  cursor: pointer;
  border-radius: 6px;
}

.emoji-item-btn:hover {
  background: #f3f4f6;
}

.image-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  font-size: 0.82rem;
  color: #6b7280;
}

.image-summary button {
  border: none;
  background: transparent;
  color: #dc2626;
  font-size: 0.82rem;
  cursor: pointer;
}
</style>
