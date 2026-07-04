<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  confirmClass: { type: String, default: 'modal-btn--accent' },
  cancelLabel: { type: String, default: 'Cancel' },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="emit('cancel')">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button type="button" class="modal-close" @click="emit('cancel')">&times;</button>
        </div>
        <div class="modal-body">
          <p class="admin-modal-message">{{ message }}</p>
        </div>
        <div class="modal-footer--row">
          <button type="button" class="action-pill" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button type="button" class="action-pill" :class="confirmClass" @click="emit('confirm')">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@import '@/assets/styles/modal.css';

.admin-modal-message {
  margin: 0;
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.5;
}

:deep(.modal-card) {
  background: var(--surface);
}

:deep(.modal-header) {
  border-bottom-color: var(--line);
}

:deep(.modal-title) {
  color: var(--brand);
}

:deep(.modal-close) {
  color: var(--muted);
}

:deep(.modal-close:hover) {
  background: var(--surface-alt);
  color: var(--text);
}

:deep(.modal-footer--row) {
  border-top-color: var(--line);
}
</style>
