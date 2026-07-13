<template>
  <div class="panel-header">
    <div class="panel-header-left">
      <button
        type="button"
        class="panel-action-btn sidebar-toggle-btn"
        @click="$emit('toggle-sidebar')"
        :title="isSessionsOpen ? 'Thu gọn lịch sử' : 'Mở lịch sử'"
        :aria-label="isSessionsOpen ? 'Thu gọn lịch sử' : 'Mở lịch sử'"
      >
        <svg v-if="!isSessionsOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="15" y2="12"></line>
          <line x1="3" y1="18" x2="18" y2="18"></line>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="panel-header-info">
        <div class="panel-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div class="panel-text">
          <div class="panel-title">AI Assistant</div>
          <div class="panel-status">IlluWrl</div>
        </div>
      </div>
    </div>
    <div class="panel-actions">
      <button type="button" class="panel-action-btn" @click="$emit('new-chat')" title="Chat mới">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button type="button" class="panel-action-btn" @click="$emit('minimize')" title="Thu gọn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button type="button" class="panel-action-btn panel-close-btn" @click="$emit('close')" title="Đóng">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isSessionsOpen: { type: Boolean, default: false }
})

defineEmits(['new-chat', 'minimize', 'close', 'toggle-sidebar'])
</script>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  background: var(--surface);
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.panel-header-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.panel-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.panel-text {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.panel-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-status {
  font-size: 0.65rem;
  color: var(--muted);
  line-height: 1.2;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex-shrink: 0;
}

.panel-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.panel-action-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.sidebar-toggle-btn.active {
  color: var(--accent);
  background: rgba(0, 150, 250, 0.1);
}

.panel-close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
</style>
