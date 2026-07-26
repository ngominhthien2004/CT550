<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)

function select(value) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function toggle() {
  isOpen.value = !isOpen.value
}

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="custom-select">
    <button type="button" class="custom-select-trigger" @click="toggle">
      <span>{{ options.find(o => o.value === modelValue)?.label }}</span>
      <i class="fa-solid fa-chevron-down" :class="{ open: isOpen }"></i>
    </button>
    <ul v-if="isOpen" class="custom-select-dropdown">
      <li
        v-for="opt in options"
        :key="opt.value"
        class="custom-select-option"
        :class="{ selected: opt.value === modelValue }"
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
}

.custom-select-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  min-width: 140px;
  text-align: left;
}

.custom-select-trigger:hover {
  border-color: var(--accent);
}

.custom-select-trigger .fa-chevron-down {
  margin-left: auto;
  font-size: 0.65rem;
  transition: transform 0.2s ease;
}

.custom-select-trigger .fa-chevron-down.open {
  transform: rotate(180deg);
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 100%;
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

.custom-select-option {
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease;
}

.custom-select-option:hover {
  background: var(--surface-alt);
}

.custom-select-option.selected {
  background: var(--accent);
  color: #fff;
}
</style>
