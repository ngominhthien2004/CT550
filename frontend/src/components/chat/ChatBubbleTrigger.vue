<template>
  <Transition name="bubble-scale">
    <div
      class="chat-bubble-trigger"
      @click="$emit('open')"
      role="button"
      tabindex="0"
      @keydown.enter="$emit('open')"
      aria-label="Mở chat"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  unreadCount: { type: Number, default: 0 }
})

defineEmits(['open'])
</script>

<style scoped>
.chat-bubble-trigger {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #0078d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 4px 20px rgba(0, 150, 250, 0.35);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
  position: relative;
}

.chat-bubble-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 28px rgba(0, 150, 250, 0.45);
}

.chat-bubble-trigger:active {
  transform: scale(0.95);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--danger);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Bubble transition */
.bubble-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bubble-scale-leave-active {
  transition: all 0.2s ease-in;
}
.bubble-scale-enter-from {
  opacity: 0;
  transform: scale(0.3);
}
.bubble-scale-leave-to {
  opacity: 0;
  transform: scale(0.3);
}

@media (max-width: 768px) {
  .chat-bubble-trigger {
    width: 52px;
    height: 52px;
  }
}

@media (max-width: 640px) {
  .chat-bubble-trigger {
    width: 50px;
    height: 50px;
  }

  .chat-bubble-trigger svg {
    width: 24px;
    height: 24px;
  }
}
</style>
