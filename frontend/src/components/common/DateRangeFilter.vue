<template>
  <div class="date-range-filter" :class="{ compact }">
    <div class="date-field">
      <label class="date-label">From</label>
      <input
        type="date"
        :value="modelValue.from"
        class="date-input"
        @input="update('from', $event.target.value)"
      />
    </div>
    <div class="date-field">
      <label class="date-label">To</label>
      <input
        type="date"
        :value="modelValue.to"
        class="date-input"
        @input="update('to', $event.target.value)"
      />
    </div>
    <button
      v-if="showClear && (modelValue.from || modelValue.to)"
      type="button"
      class="btn-clear"
      @click="clear"
    >
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ from: '', to: '' })
  },
  compact: {
    type: Boolean,
    default: false
  },
  showClear: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function clear() {
  emit('update:modelValue', { from: '', to: '' })
}
</script>

<style scoped>
.date-range-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-field {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.date-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}

.date-input {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  font-size: 0.78rem;
  background: var(--surface);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
  width: 130px;
}

.date-input:focus {
  border-color: var(--accent);
}

.compact .date-label {
  font-size: 0.72rem;
}

.compact .date-input {
  padding: 0.25rem 0.4rem;
  font-size: 0.72rem;
  width: 120px;
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: background 0.15s;
}

.btn-clear:hover {
  background: var(--surface-alt);
}
</style>
