<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  chapters: { type: Array, required: true },
  selectedChapterId: { type: String, default: '' },
})

const emit = defineEmits(['select'])
const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedChapter = computed(() => {
  return props.chapters.find(ch => ch._id === props.selectedChapterId)
})

function toggle() {
  isOpen.value = !isOpen.value
}

function select(chapterId) {
  emit('select', chapterId)
  isOpen.value = false
}

function onClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div v-if="chapters.length > 1" ref="dropdownRef" class="chapter-selector-group">
    <span class="chapter-label">Chapter</span>
    <div class="custom-select-wrap">
      <button
        type="button"
        class="custom-select-trigger"
        :class="{ 'is-open': isOpen }"
        @click="toggle"
        aria-label="Select chapter"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
      >
        <span class="trigger-text">
          {{ selectedChapter?.title || 'Untitled' }}
        </span>
        <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
      </button>
      <div v-if="isOpen" class="custom-select-menu" role="listbox" aria-label="Chapter list">
        <button
          v-for="ch in chapters"
          :key="ch._id"
          type="button"
          class="custom-select-item"
          :class="{ 'is-selected': ch._id === selectedChapterId }"
          role="option"
          :aria-selected="ch._id === selectedChapterId"
          @click="select(ch._id)"
        >
          {{ ch.title || 'Untitled' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapter-selector-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  justify-content: center;
}

.chapter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--novel-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.custom-select-wrap {
  position: relative;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--novel-border);
  border-radius: 0.72rem;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  font-size: 0.9rem;
  cursor: pointer;
  max-width: 100%;
  white-space: nowrap;
  transition: border-color 0.15s;
}

.custom-select-trigger:hover,
.custom-select-trigger.is-open {
  border-color: var(--novel-accent);
}

.trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

.custom-select-menu {
  position: absolute;
  left: 0;
  top: calc(100% + 0.4rem);
  display: flex;
  flex-direction: column;
  min-width: 280px;
  padding: 0.35rem;
  border: 1px solid var(--novel-border);
  border-radius: 0.72rem;
  background: var(--novel-bg);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 20;
  max-height: 240px;
  overflow-y: auto;
}

.custom-select-item {
  all: unset;
  cursor: pointer;
  color: var(--novel-text-color);
  padding: 0.45rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  text-align: left;
  transition: background 0.12s;
}

.custom-select-item:hover,
.custom-select-item:focus-visible {
  background: var(--novel-accent);
  color: #fff;
}

.custom-select-item.is-selected {
  font-weight: 600;
  background: var(--novel-accent);
  color: #fff;
}
</style>
