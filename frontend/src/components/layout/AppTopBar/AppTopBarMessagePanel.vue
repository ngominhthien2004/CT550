<script setup>
import { computed } from 'vue'

const props = defineProps({
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

const processedItems = computed(() =>
  props.items.map(item => ({
    ...item,
    _time: props.formatTime(item.createdAt),
    _previewText: (() => {
      const hasImages = Array.isArray(item.images) && item.images.length > 0
      if (hasImages && !item.content) return '[Image]'
      if (item.content && item.content.length > 80) return item.content.slice(0, 80) + '...'
      return item.content || ''
    })(),
  }))
)
</script>

<template>
  <details class="quick-panel" :open="open" @toggle="$emit('toggle', $event)">
    <summary class="icon-round panel-trigger" aria-label="Messages" title="Messages">
      <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      <span
        v-if="unreadCount"
        class="alert-dot"
        :class="{ 'is-dot-only': !open }"
        :aria-label="open ? 'Unread messages' : 'Unread messages available'"
      >
        <template v-if="open">{{ unreadCount > 9 ? '9+' : unreadCount }}</template>
      </span>
    </summary>
    <div class="quick-panel-box" role="menu" aria-label="Message preview panel">
      <div class="quick-panel-head">
        <p class="quick-panel-title">
          Messages
          <span v-if="unreadCount" class="quick-panel-count">({{ unreadCount > 9 ? '9+' : unreadCount }})</span>
        </p>
        <router-link to="/messages" class="quick-view-all" role="menuitem">View all</router-link>
      </div>

      <p v-if="loading" class="quick-panel-note">Loading...</p>
      <p v-else-if="error" class="quick-panel-note error">{{ error }}</p>
      <div v-else-if="items.length" class="quick-panel-list">
        <div
          v-for="item in processedItems"
          :key="item._id"
          class="quick-panel-item"
          :class="{ unread: !item.isRead }"
        >
          <router-link to="/messages" class="quick-panel-link" role="menuitem">
            <div class="quick-item-row">
              <div class="q-avatar">
                <img :src="item.sender?.avatar || 'https://s.pximg.net/common/images/no_profile.png'" alt="avatar"
                     @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'" />
              </div>
              <div class="quick-item-meta">
                <div class="quick-item-top">
                  <strong>{{ item.sender?.displayName || item.sender?.username || 'Unknown' }}</strong>
                  <small>{{ item._time }}</small>
                </div>
                <span v-if="item._previewText">{{ item._previewText }}</span>
              </div>
            </div>
          </router-link>
          <button
            v-if="!item.isRead"
            type="button"
            class="action-pill action-pill--small"
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

<style scoped src="./quick-panel-styles.css"></style>
<style scoped>
.alert-dot.is-dot-only {
  min-width: 10px;
  width: 10px;
  height: 10px;
  padding: 0;
}

.quick-panel-count {
  letter-spacing: 0;
  text-transform: none;
  color: var(--text);
  margin-left: 0.2rem;
}

.quick-item-meta {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 0.2rem;
}
</style>
