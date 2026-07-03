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
    <div v-if="open" class="dd-panel">
      <slot :close="close" />
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

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

/* Admin actions menu item sizing override */
.dd-panel :deep(.dd-item),
.dd-panel :deep(button),
.dd-panel :deep(a) {
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
}
</style>
