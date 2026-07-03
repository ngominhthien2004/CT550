<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['share', 'report'])

const isOpen = ref(false)
const menuRef = ref(null)

function toggleMenu(e) {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function handleShare() {
  closeMenu()
  emit('share')
}

function handleReport() {
  closeMenu()
  emit('report')
}

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    closeMenu()
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="card-menu-wrapper" ref="menuRef">
    <button type="button" class="card-menu-trigger" @click="toggleMenu" title="More options" aria-label="More options">
      <i class="fa-solid fa-ellipsis"></i>
    </button>
    <Transition name="menu-fade">
      <div v-if="isOpen" class="card-menu-dropdown">
        <button type="button" class="card-menu-item" @click="handleShare">
          <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
          <span>Share</span>
        </button>
        <button type="button" class="card-menu-item" @click="handleReport">
          <i class="fa-regular fa-flag" aria-hidden="true"></i>
          <span>Report</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.card-menu-wrapper {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
}

.card-menu-trigger {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  font-size: 0.82rem;
}

.artwork-card:hover .card-menu-trigger,
.novel-compact-card:hover .card-menu-trigger {
  opacity: 1;
}

.card-menu-trigger:hover {
  background: rgba(0, 0, 0, 0.6);
}

.card-menu-dropdown {
  position: absolute;
  top: 38px;
  right: 0;
  min-width: 160px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  padding: 4px 0;
  overflow: hidden;
}

.card-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  color: var(--text);
  font-size: 0.88rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.card-menu-item:hover {
  background: var(--surface-alt);
}

.card-menu-item i {
  width: 16px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
