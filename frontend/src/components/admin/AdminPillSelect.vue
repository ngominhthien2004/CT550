<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const dropdownRef = ref(null)

function toggle() {
  open.value = !open.value
}

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}

function close() {
  open.value = false
}

function onClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    close()
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const selectedLabel = (value) => {
  const opt = props.options.find(o => o.value === value)
  return opt?.label || value || 'Select'
}
</script>

<template>
  <div class="pill-select" ref="dropdownRef">
    <button type="button" class="pill-trigger" @click.stop="toggle" :aria-label="label">
      {{ selectedLabel(modelValue) }}
      <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
    </button>
    <div v-if="open" class="dd-panel">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="dd-item"
        :class="{ active: modelValue === opt.value }"
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

<style scoped>
.pill-select {
  position: relative;
  display: inline-block;
}

.pill-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.pill-trigger i {
  font-size: 0.55rem;
  opacity: 0.6;
  transition: transform 0.15s;
}

.pill-select.is-open .pill-trigger i {
  transform: rotate(180deg);
}

.pill-trigger:hover {
  background: var(--surface-alt);
  border-color: var(--muted);
}

/* Pill select item sizing override */
.dd-panel .dd-item {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
