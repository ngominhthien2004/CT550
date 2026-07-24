<template>
  <div :class="['panel-sidebar', { open: isOpen }]">
    <div class="sidebar-inner">
      <div class="sidebar-search">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          type="text"
          class="search-input"
          placeholder="Tìm kiếm..."
          aria-label="Tìm kiếm lịch sử chat"
        />
      </div>
      <div class="session-list">
        <div v-if="isLoading" class="session-state">
          <div class="spinner"></div>
          <span>Đang tải...</span>
        </div>
        <div v-else-if="sessions.length === 0" class="session-state">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="session-state-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span v-if="search">Không tìm thấy</span>
          <span v-else>Chưa có cuộc trò chuyện</span>
        </div>
        <div
          v-for="session in sessions"
          :key="session._id"
          :class="['session-item', { active: session._id === currentId }]"
          role="button"
          tabindex="0"
          @click="$emit('select', session._id)"
          @keydown.enter="$emit('select', session._id)"
        >
          <div class="session-status-dot" :class="getSessionStatusClass(session)"></div>
          <div class="session-item-content">
            <div class="session-item-title">{{ session.title || 'Cuộc trò chuyện mới' }}</div>
            <div class="session-item-time">{{ formatSessionTime(session.updatedAt) }}</div>
          </div>
          <button
            class="session-delete-btn"
            @click="$emit('delete', $event, session._id)"
            title="Xóa"
            aria-label="Xóa cuộc trò chuyện"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { formatShortDate } from '../../utils/date.js'

const { locale } = useI18n()

defineProps({
  isOpen: { type: Boolean, default: false },
  sessions: { type: Array, default: () => [] },
  currentId: { type: String, default: null },
  isLoading: { type: Boolean, default: false },
  search: { type: String, default: '' }
})

defineEmits(['update:search', 'select', 'delete'])

function getSessionStatusClass(session) {
  if (!session.updatedAt) return ''
  const now = Date.now()
  const updated = new Date(session.updatedAt).getTime()
  const diffHours = (now - updated) / 3600000
  if (diffHours < 2) return 'active'
  if (diffHours < 24) return 'recent'
  return ''
}

function formatSessionTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString()
  const pad = n => String(n).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (isToday) return `Hôm nay, ${time}`
  if (isYesterday) return `Hôm qua, ${time}`
  return formatShortDate(ts, locale.value)
}
</script>

<style scoped>
.panel-sidebar {
  width: 0;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid var(--line);
}

.panel-sidebar.open {
  width: 180px;
}

.sidebar-inner {
  width: 180px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-search {
  position: relative;
  padding: 0.5rem;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.4rem 0.5rem 0.4rem 28px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.75rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(0, 150, 250, 0.12);
}

.search-input::placeholder {
  color: var(--muted);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.375rem 0.375rem;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.session-list::-webkit-scrollbar {
  width: 3px;
}

.session-list::-webkit-scrollbar-track {
  background: transparent;
}

.session-list::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 3px;
}

.session-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 1.5rem 0.5rem;
  color: var(--muted);
  font-size: 0.7rem;
  text-align: center;
}

.session-state-icon {
  opacity: 0.4;
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

.session-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 1px;
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  position: relative;
}

.session-item:hover {
  background: var(--surface-alt);
}

.session-item.active {
  background: linear-gradient(135deg, rgba(0, 150, 250, 0.1), rgba(124, 58, 237, 0.06));
}

.session-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--muted);
}

.session-status-dot.active {
  background: #22c55e;
}

.session-status-dot.recent {
  background: var(--accent);
}

.session-item.active .session-status-dot {
  background: var(--accent);
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-title {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.session-item.active .session-item-title {
  font-weight: 600;
}

.session-item-time {
  font-size: 0.6rem;
  color: var(--muted);
  margin-top: 1px;
}

.session-delete-btn {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.2s;
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.session-delete-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

@media (max-width: 640px) {
  .panel-sidebar.open {
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    background: var(--surface);
  }

  .sidebar-inner {
    width: 100%;
  }
}
</style>
