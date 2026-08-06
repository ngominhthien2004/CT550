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
    <button type="button" class="card-menu-trigger" @click="toggleMenu" :title="$t('artwork.moreOptions')" :aria-label="$t('artwork.moreOptions')">
      <i class="fa-solid fa-ellipsis"></i>
    </button>
    <Transition name="menu-fade">
      <div v-if="isOpen" class="dd-panel">
        <button type="button" class="dd-item" @click="handleShare">
          <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
          <span>{{ $t('artwork.share') }}</span>
        </button>
        <button type="button" class="dd-item" @click="handleReport">
          <i class="fa-regular fa-flag" aria-hidden="true"></i>
          <span>{{ $t('artwork.report') }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>
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

/* Override dd-panel positioning for card context */
.card-menu-wrapper .dd-panel {
  top: calc(100% + 4px);
  right: 0;
  left: auto;
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
