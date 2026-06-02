<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="'toast--' + toast.type"
          role="alert"
        >
          <span class="toast-msg">{{ toast.message }}</span>
          <button
            type="button"
            class="toast-close"
            aria-label="Close"
            @click="remove(toast.id)"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 99999;
  display: grid;
  gap: 0.5rem;
  max-width: 400px;
  width: 100%;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: #1f2937;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
  pointer-events: auto;
  animation: slideIn 0.25s ease;
}

.toast--success { background: #065f46; }
.toast--error { background: #991b1b; }
.toast--info { background: #1e40af; }

.toast-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.toast-close:hover { color: #fff; }

.toast-enter-active { animation: slideIn 0.25s ease; }
.toast-leave-active { animation: slideIn 0.2s ease reverse; }

@keyframes slideIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
