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

const processedItems = computed(() =>
  props.items.map(item => ({
    ...item,
    _time: formatRelativeTime(item.createdAt),
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

<style scoped>
.quick-panel {
  position: relative;
}

.icon-round {
  text-decoration: none;
  color: inherit;
  border: none;
  background: var(--surface);
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
  background: var(--danger);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface);
}

.alert-dot.is-dot-only {
  min-width: 10px;
  width: 10px;
  height: 10px;
  padding: 0;
}

.quick-panel-box {
  position: absolute;
  right: 0;
  top: calc(100% + 0.46rem);
  width: 352px;
  max-height: min(72vh, 430px);
  overflow-y: auto;
  scrollbar-width: none;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  z-index: 24;
}

.quick-panel-box::-webkit-scrollbar {
  display: none;
}

.quick-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid var(--line);
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

.quick-panel-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text);
}

.quick-view-all {
  font-size: 0.78rem;
  color: var(--accent);
  text-decoration: none;
}

.quick-view-all:hover {
  text-decoration: underline;
}

.quick-panel-list {
  display: grid;
}

.quick-panel-item {
  border-bottom: 1px solid var(--line);
  padding: 0.58rem 0.85rem;
  display: grid;
  gap: 0.35rem;
}

.quick-panel-item.unread {
  background: var(--surface-alt);
}

.quick-panel-item:hover,
.quick-panel-item:focus-within {
  background: var(--surface-alt);
}

.quick-panel-link {
  text-decoration: none;
  color: var(--text);
  display: block;
}

.quick-item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.q-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 0.85rem;
}

.q-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.quick-item-content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.15rem;
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
  color: var(--muted);
  font-size: 0.79rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quick-panel-link small {
  color: var(--muted);
  font-size: 0.71rem;
  flex-shrink: 0;
}

.quick-action {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--accent-hover);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.16rem 0.55rem;
  justify-self: start;
}

.quick-action:hover,
.quick-action:focus-visible {
  background: var(--surface-alt);
}

.quick-panel-note {
  margin: 0;
  padding: 0.8rem;
  color: var(--muted);
  font-size: 0.82rem;
}

.quick-panel-note.error {
  color: var(--danger);
}

.quick-panel-sentinel {
  padding: 0.5rem;
  text-align: center;
}
</style>
