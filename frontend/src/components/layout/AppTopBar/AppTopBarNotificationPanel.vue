<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { formatRelativeTime } from '../../../utils/date'

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
  loadingMore: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: true,
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

const emit = defineEmits(['toggle', 'mark-all-read', 'load-more'])

const sentinelRef = ref(null)
const panelRef = ref(null)
let observer = null

function computeNotificationLink(item) {
  const type = item.type || ''
  const artworkId = item.artwork?._id
  const username = item.actor?.username

  if (['like', 'bookmark', 'comment'].includes(type) && artworkId) {
    return `/artworks/${artworkId}`
  }
  if (type === 'follow' && username) {
    return `/${username}`
  }
  if (type === 'message') {
    return '/messages'
  }
  if (type === 'request') {
    return '/requests'
  }
  if (type.startsWith('system:')) {
    if (type === 'system:artwork_report') return '/admin/reports?type=artwork'
    if (type === 'system:comment_report') return '/admin/reports?type=comment'
    if (type === 'system:user_report') return '/admin/reports?type=user'
  }
  if (type === 'system' && artworkId) {
    return `/artworks/${artworkId}`
  }
  return '/notifications'
}

const processedItems = computed(() =>
  props.items.map(item => ({
    ...item,
    _time: formatRelativeTime(item.createdAt),
    _link: computeNotificationLink(item),
  }))
)

function setupObserver() {
  observer?.disconnect()
  if (!sentinelRef.value || !panelRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loadingMore) {
        emit('load-more')
      }
    },
    { root: panelRef.value, rootMargin: '50px' }
  )
  observer.observe(sentinelRef.value)
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    setupObserver()
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <details class="quick-panel" :open="open" @toggle="$emit('toggle', $event)">
    <summary class="icon-round panel-trigger" aria-label="Notifications" title="Notifications">
      <i class="fa-regular fa-bell" aria-hidden="true"></i>
      <span v-if="unreadCount" class="alert-dot" aria-label="Unread notifications">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </summary>
    <div ref="panelRef" class="quick-panel-box" role="menu" aria-label="Notification preview panel">
      <div class="quick-panel-head">
        <p class="quick-panel-title">Notifications</p>
        <div class="quick-panel-actions">
          <button
            v-if="unreadCount > 0"
            type="button"
            class="quick-action-link"
            @click="$emit('mark-all-read')"
          >
            Mark all read
          </button>
          <router-link to="/notifications" class="quick-view-all" role="menuitem">View all</router-link>
        </div>
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
          <router-link :to="item._link" class="quick-panel-link" role="menuitem">
            <div class="quick-item-row">
              <div class="q-avatar">
                <img
                  v-if="item.actor?.avatar"
                  :src="item.actor.avatar"
                  :alt="item.actor.displayName || item.actor.username"
                  @error="(e) => e.target.style.display = 'none'"
                />
                <i v-else class="fa-regular fa-user" aria-hidden="true"></i>
              </div>
              <div class="quick-item-content">
                <div class="quick-item-top">
                  <strong>{{ item.actor?.displayName || item.actor?.username || 'System' }}</strong>
                  <small>{{ item._time }}</small>
                </div>
                <span>{{ item.message }}</span>
              </div>
            </div>
          </router-link>

        </div>
        <div ref="sentinelRef" class="quick-panel-sentinel">
          <span v-if="loadingMore" class="quick-panel-note">Loading more...</span>
          <span v-else-if="!hasMore && items.length" class="quick-panel-note">No more notifications.</span>
        </div>
      </div>
      <p v-else class="quick-panel-note">No notifications yet.</p>
    </div>
  </details>
</template>

<style scoped src="../../../assets/styles/quick-panel.css"></style>
<style scoped>
/* Overrides — NotificationPanel needs slightly different values */
.quick-panel-box {
  scrollbar-width: none;
}

.quick-panel-box::-webkit-scrollbar {
  display: none;
}

.quick-panel-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.quick-action-link {
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 500;
  padding: 0;
  cursor: pointer;
}

.quick-action-link:hover {
  color: var(--accent);
}

.quick-panel-link {
  display: block;
}

.quick-item-row {
  align-items: flex-start;
}

.q-avatar {
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 0.85rem;
}

.quick-item-content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.quick-panel-sentinel {
  padding: 0.5rem;
  text-align: center;
}
</style>
