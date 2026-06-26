<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const dropdownRef = ref(null)

function toggle() {
  open.value = !open.value
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
</script>

<template>
  <div class="admin-actions-dropdown" ref="dropdownRef">
    <button type="button" class="admin-actions-trigger" @click="toggle" aria-label="Actions">
      <i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>
    </button>
    <div v-if="open" class="admin-actions-menu">
      <slot :close="close" />
    </div>
  </div>
</template>

<style scoped>
.admin-actions-dropdown {
  position: relative;
  display: inline-block;
}

.admin-actions-trigger {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s, color 0.15s;
}

.admin-actions-trigger:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.admin-actions-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 160px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  padding: 0.3rem 0;
  display: grid;
  gap: 0;
}

.admin-actions-menu :deep(button),
.admin-actions-menu :deep(a) {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s;
  white-space: nowrap;
}

.admin-actions-menu :deep(button:hover),
.admin-actions-menu :deep(a:hover) {
  background: var(--surface-alt);
}

.admin-actions-menu :deep(button:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

.admin-actions-menu :deep(.dropdown-danger) {
  color: var(--danger);
}

.admin-actions-menu :deep(.dropdown-danger:hover) {
  background: rgba(220, 38, 38, 0.08);
}

.admin-actions-menu :deep(.dropdown-success) {
  color: #22c55e;
}

.admin-actions-menu :deep(.dropdown-success:hover) {
  background: rgba(34, 197, 94, 0.08);
}

.admin-actions-menu :deep(.dropdown-warning) {
  color: #f59e0b;
}

.admin-actions-menu :deep(.dropdown-warning:hover) {
  background: rgba(245, 158, 11, 0.08);
}
</style>
