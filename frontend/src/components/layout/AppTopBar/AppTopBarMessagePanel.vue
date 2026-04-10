<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  formatTime: {
    type: Function,
    required: true,
  },
})

defineEmits(['toggle', 'mark-read'])
</script>

<template>
  <details class="quick-panel" :open="open" @toggle="$emit('toggle', $event)">
    <summary class="icon-round panel-trigger" aria-label="Messages" title="Messages">
      <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      <span v-if="unreadCount" class="alert-dot" aria-label="Unread messages">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </summary>
    <div class="quick-panel-box" role="menu" aria-label="Message preview panel">
      <div class="quick-panel-head">
        <p class="quick-panel-title">Messages</p>
        <router-link to="/messages" class="quick-view-all" role="menuitem">View all</router-link>
      </div>

      <p v-if="loading" class="quick-panel-note">Loading...</p>
      <p v-else-if="error" class="quick-panel-note error">{{ error }}</p>
      <div v-else-if="items.length" class="quick-panel-list">
        <div
          v-for="item in items"
          :key="item._id"
          class="quick-panel-item"
          :class="{ unread: !item.isRead }"
        >
          <router-link to="/messages" class="quick-panel-link" role="menuitem">
            <div class="quick-item-top">
              <strong>{{ item.sender?.displayName || item.sender?.username || 'Unknown' }}</strong>
              <small>{{ formatTime(item.createdAt) }}</small>
            </div>
            <span>{{ item.content }}</span>
          </router-link>
          <button
            v-if="!item.isRead"
            type="button"
            class="quick-action"
            aria-label="Mark message as read"
            @click.stop="$emit('mark-read', item._id)"
          >
            Mark read
          </button>
        </div>
      </div>
      <p v-else class="quick-panel-note">No messages yet.</p>
    </div>
  </details>
</template>

<style scoped>
.quick-panel {
  position: relative;
}

.icon-round {
  text-decoration: none;
  color: inherit;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.panel-trigger {
  list-style: none;
  position: relative;
}

.panel-trigger::-webkit-details-marker {
  display: none;
}

.alert-dot {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  padding: 0 0.25rem;
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

.quick-panel-box {
  position: absolute;
  right: 0;
  top: calc(100% + 0.46rem);
  width: 352px;
  max-height: min(72vh, 430px);
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
  z-index: 24;
}

.quick-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid #eceff3;
}

.quick-panel-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #334155;
}

.quick-view-all {
  font-size: 0.78rem;
  color: #3b82f6;
  text-decoration: none;
}

.quick-view-all:hover {
  text-decoration: underline;
}

.quick-panel-list {
  display: grid;
}

.quick-panel-item {
  border-bottom: 1px solid #f0f2f5;
  padding: 0.58rem 0.85rem;
  display: grid;
  gap: 0.35rem;
}

.quick-panel-item.unread {
  background: #fbfdff;
}

.quick-panel-item:hover,
.quick-panel-item:focus-within {
  background: #f6f8fb;
}

.quick-panel-link {
  text-decoration: none;
  color: #1f2937;
  display: grid;
  gap: 0.2rem;
}

.quick-item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.45rem;
}

.quick-panel-link strong {
  font-size: 0.82rem;
  line-height: 1.2;
  font-weight: 700;
}

.quick-panel-link span {
  color: #475569;
  font-size: 0.79rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quick-panel-link small {
  color: #94a3b8;
  font-size: 0.71rem;
  flex-shrink: 0;
}

.quick-action {
  border: 1px solid #dbe4ef;
  background: #fff;
  color: #2563eb;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.16rem 0.55rem;
  justify-self: start;
}

.quick-action:hover,
.quick-action:focus-visible {
  background: #eef4ff;
}

.quick-panel-note {
  margin: 0;
  padding: 0.8rem;
  color: #64748b;
  font-size: 0.82rem;
}

.quick-panel-note.error {
  color: #dc2626;
}
</style>
