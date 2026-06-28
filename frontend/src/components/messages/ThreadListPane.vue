<script setup>
defineProps({
  threads: { type: Array, required: true },
  selectedThreadId: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  unreadCount: { type: Number, default: 0 },
})

const emit = defineEmits(['select'])
</script>

<template>
  <aside class="thread-list-pane">
    <header class="pane-head">
      <div>
        <h1 class="h5 mb-0">Chats</h1>
        <p class="text-secondary mb-0 small">Unread: {{ unreadCount }}</p>
      </div>
    </header>

    <div v-if="loading" class="pane-skeletons" aria-hidden="true">
      <div v-for="i in 5" :key="'sk-thread-' + i" class="skeleton-thread-item">
        <div class="skeleton-avatar shimmer"></div>
        <div class="skeleton-meta">
          <div class="skeleton-line shimmer short"></div>
          <div class="skeleton-line shimmer medium"></div>
        </div>
      </div>
    </div>
    <p v-else-if="error" class="pane-note error">{{ error }}</p>

    <div v-else-if="threads.length" class="thread-list" role="listbox" aria-label="Conversation threads">
      <button
        v-for="thread in threads"
        :key="thread.peerId"
        type="button"
        class="thread-item"
        :class="{ active: selectedThreadId === thread.peerId }"
        @click="emit('select', thread.peerId)"
      >
        <div class="thread-avatar">
          <img :src="thread.peer?.avatar || 'https://s.pximg.net/common/images/no_profile.png'" alt="avatar" @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'" />
        </div>
        <div class="thread-meta">
          <div class="thread-top">
            <strong>{{ thread.peer?.displayName || thread.peer?.username || 'Unknown user' }}</strong>
            <small>{{ thread._formattedTime }}</small>
          </div>
          <p>{{ thread._previewText }}</p>
        </div>
        <span v-if="thread.unreadCount" class="thread-badge">{{ thread.unreadCount }}</span>
      </button>
    </div>

    <p v-else class="pane-note">No messages yet.</p>
  </aside>
</template>

<style scoped>
.thread-list-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  overflow: hidden;
}

.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.pane-link {
  font-size: 0.78rem;
  color: #6366f1;
  text-decoration: none;
}

.pane-skeletons {
  padding: 1rem;
}

.skeleton-thread-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e5e7eb;
}

.skeleton-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 0.75rem;
  border-radius: 4px;
  background: #e5e7eb;
}

.skeleton-line.short { width: 40%; }
.skeleton-line.medium { width: 70%; }

.shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.pane-note {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.88rem;
}

.pane-note.error { color: #dc2626; }

.thread-list {
  flex: 1;
  overflow-y: auto;
}

.thread-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1.25rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}

.thread-item:hover { background: #f9fafb; }
.thread-item.active { background: #eef2ff; }

.thread-avatar {
  flex-shrink: 0;
}

.thread-avatar img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.thread-meta {
  flex: 1;
  min-width: 0;
}

.thread-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.thread-top strong {
  font-size: 0.88rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-top small {
  font-size: 0.72rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.thread-meta p {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-badge {
  background: #6366f1;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  padding: 0 0.4rem;
}
</style>
