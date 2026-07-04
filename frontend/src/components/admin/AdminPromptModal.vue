<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Input' },
  message: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  defaultValue: { type: String, default: '' },
  confirmLabel: { type: String, default: 'OK' },
  cancelLabel: { type: String, default: 'Cancel' },
})

const emit = defineEmits(['confirm', 'cancel'])
const inputValue = ref(props.defaultValue)

watch(() => props.show, (val) => {
  if (val) inputValue.value = props.defaultValue
})
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
          <p v-if="message" class="admin-prompt-message">{{ message }}</p>
          <input
            v-model="inputValue"
            type="text"
            class="form-control admin-prompt-input"
            :placeholder="placeholder"
            @keyup.enter="emit('confirm', inputValue)"
          />
        </div>
        <div class="modal-footer--row">
          <button type="button" class="action-pill" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button type="button" class="action-pill action-pill--post" @click="emit('confirm', inputValue)">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@import '@/assets/styles/modal.css';

.admin-prompt-message {
  margin: 0 0 0.75rem;
  color: var(--muted);
  font-size: 0.88rem;
}

.admin-prompt-input {
  width: 100%;
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
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
