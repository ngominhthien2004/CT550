<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { formatRelativeTime } from '../../utils/date'
import { getNotificationLink } from '../../utils/notificationLink'

const props = defineProps({
  notification: { type: Object, required: true },
  duration: { type: Number, default: 5000 },
})

const emit = defineEmits(['close'])

const router = useRouter()
const visible = ref(false)
let timer = null

function handleClick() {
  const link = getNotificationLink(props.notification)
  if (link) {
    router.push(link)
  }
  emit('close')
}

function startTimer() {
  timer = setTimeout(() => {
    visible.value = false
    setTimeout(() => emit('close'), 300)
  }, props.duration)
}

onMounted(() => {
  visible.value = true
  startTimer()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast-container" @click="handleClick">
      <div class="toast-avatar">
        <img
          v-if="notification.actor?.avatar"
          :src="notification.actor.avatar"
          :alt="notification.actor.displayName || notification.actor.username"
          @error="(e) => e.target.style.display = 'none'"
        />
        <i v-else class="fa-regular fa-bell" aria-hidden="true"></i>
      </div>
      <div class="toast-content">
        <p class="toast-message">{{ notification.message }}</p>
        <small class="toast-time">{{ formatRelativeTime(notification.createdAt) }}</small>
      </div>
      <button class="toast-close" @click.stop="emit('close')" aria-label="Dismiss">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  max-width: 360px;
  transition: opacity 0.3s, transform 0.3s;
}

.toast-avatar {
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

.toast-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast-time {
  color: var(--muted);
  font-size: 0.71rem;
}

.toast-close {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.toast-close:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100px);
  }
}
</style>
