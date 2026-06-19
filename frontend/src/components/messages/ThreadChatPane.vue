<script setup>
import { ref } from 'vue'
import MessageBubble from './MessageBubble.vue'
import ComposeForm from './ComposeForm.vue'

const props = defineProps({
  selectedThreadId: { type: String, default: '' },
  headerTitle: { type: String, default: '' },
  presenceState: { type: Object, default: () => ({ online: false, typing: false, lastSeen: null }) },
  threadSearchQuery: { type: String, default: '' },
  searchActive: { type: Boolean, default: false },
  displayedTimeline: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  content: { type: String, default: '' },
  sending: { type: Boolean, default: false },
  selectedImages: { type: Array, default: () => [] },
  replyingTo: { type: Object, default: null },
  isDragging: { type: Boolean, default: false },
  currentUserId: { type: String, default: '' },
  parseMessageContent: { type: Function, required: true },
})

const emit = defineEmits([
  'back', 'search', 'clear-search', 'update:threadSearchQuery',
  'reply', 'delete', 'mark-read', 'scroll-images',
  'update:content', 'send', 'typing', 'image-select', 'clear-images',
  'dragover', 'dragleave', 'drop',
])

const chatBodyRef = ref(null)

function scrollToBottom() {
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

defineExpose({ scrollToBottom })
</script>

<template>
  <section
    class="thread-pane"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)"
    @drop="emit('drop', $event)"
  >
    <header class="pane-head thread-head">
      <div style="display:flex;align-items:center;gap:0.6rem;width:100%;">
        <button v-if="selectedThreadId" type="button" class="btn btn-sm btn-outline-secondary mobile-back" @click="emit('back')">Back</button>
        <h2 class="h6 mb-0" style="flex:1;display:flex;align-items:center;gap:0.35rem;">
          {{ headerTitle }}
          <span v-if="selectedThreadId && presenceState.online" class="presence-indicator">
            <span class="presence-dot" :class="{ online: !presenceState.typing, typing: presenceState.typing }"></span>
            <span class="presence-text">{{ presenceState.typing ? 'typing...' : 'Online' }}</span>
          </span>
          <span v-else-if="selectedThreadId && !presenceState.online && presenceState.lastSeen" class="presence-indicator">
            <span class="presence-dot offline"></span>
            <span class="presence-text">Offline</span>
          </span>
        </h2>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <input :value="threadSearchQuery" placeholder="Search this conversation" aria-label="Search this conversation" class="thread-search-input form-control form-control-sm" style="width:220px" @input="emit('update:threadSearchQuery', $event.target.value)" />
          <button type="button" class="btn btn-sm btn-outline-primary" @click="emit('search')">Search</button>
          <button v-if="searchActive" type="button" class="btn btn-sm btn-outline-secondary" @click="emit('clear-search')">Clear</button>
        </div>
      </div>
    </header>

    <div v-if="isDragging" class="drag-drop-overlay">
      <div class="drag-drop-box">
        <i class="fa-regular fa-image drag-icon"></i>
        <p>Drop images here to attach</p>
      </div>
    </div>

    <div class="thread-body" ref="chatBodyRef">
      <div v-if="loading" class="skeleton-flow" aria-hidden="true">
        <div v-for="i in 4" :key="'sk-bubble-' + i" class="skeleton-bubble-wrap" :class="i % 2 === 0 ? 'outgoing' : 'incoming'">
          <div class="skeleton-bubble shimmer"></div>
        </div>
      </div>

      <div v-else-if="displayedTimeline.length" class="message-flow">
        <template v-for="row in displayedTimeline" :key="row.key">
          <p v-if="row.type === 'day'" class="day-separator">{{ row.label }}</p>
          <MessageBubble
            v-else
            :row="row"
            :current-user-id="currentUserId"
            @reply="emit('reply', $event)"
            @delete="emit('delete', $event)"
            @mark-read="emit('mark-read', $event)"
            @scroll-images="scrollToBottom"
          />
        </template>
      </div>
      <p v-else class="pane-note">No conversation selected. Pick a user from the left to start chatting.</p>
    </div>

    <div v-if="replyingTo" class="reply-context-bar">
      <div class="reply-context-info">
        <i class="fa-solid fa-reply reply-icon"></i>
        <div class="reply-context-text">
          <span class="reply-to-user">Replying to <strong>@{{ replyingTo.sender?.username || 'user' }}</strong></span>
          <p class="reply-to-snippet">{{ parseMessageContent(replyingTo.content).body }}</p>
        </div>
      </div>
      <button type="button" class="btn-close-reply" @click="$emit('reply', null)" aria-label="Cancel reply">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <ComposeForm
      :content="content"
      :sending="sending"
      :selected-thread-id="selectedThreadId"
      :selected-images="selectedImages"
      @update:content="emit('update:content', $event)"
      @send="emit('send')"
      @typing="emit('typing')"
      @image-select="emit('image-select', $event)"
      @clear-images="emit('clear-images')"
    />
  </section>
</template>

<style scoped>
.thread-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #fff;
}

.pane-head {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.thread-head {
  display: flex;
  align-items: center;
}

.presence-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

.presence-dot.online { background: #22c55e; }
.presence-dot.typing { background: #f59e0b; animation: pulse 1s infinite; }
.presence-dot.offline { background: #d1d5db; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.drag-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(99, 102, 241, 0.1);
  display: grid;
  place-items: center;
  z-index: 10;
}

.drag-drop-box {
  background: #fff;
  border: 2px dashed #6366f1;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.drag-icon {
  font-size: 2rem;
  color: #6366f1;
  margin-bottom: 0.5rem;
}

.thread-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.skeleton-flow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-bubble-wrap.outgoing {
  display: flex;
  justify-content: flex-end;
}

.skeleton-bubble {
  width: 60%;
  height: 40px;
  border-radius: 16px;
  background: #e5e7eb;
}

.skeleton-bubble-wrap.outgoing .skeleton-bubble {
  background: #c7d2fe;
}

.shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.message-flow {
  display: flex;
  flex-direction: column;
}

.day-separator {
  text-align: center;
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 1rem 0;
}

.pane-note {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.reply-context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #eef2ff;
  border-top: 1px solid #c7d2fe;
}

.reply-context-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reply-icon { color: #6366f1; }

.reply-to-user {
  font-size: 0.82rem;
  color: #6366f1;
}

.reply-to-snippet {
  margin: 0;
  font-size: 0.78rem;
  color: #6b7280;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-close-reply {
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.mobile-back {
  display: none;
}

@media (max-width: 768px) {
  .mobile-back { display: inline-block; }
}
</style>
