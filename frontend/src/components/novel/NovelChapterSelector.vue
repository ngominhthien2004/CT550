<script setup>
defineProps({
  chapters: { type: Array, required: true },
  selectedChapterId: { type: String, default: '' },
})

const emit = defineEmits(['select'])
</script>

<template>
  <div v-if="chapters.length > 1" class="chapter-selector-group">
    <label for="novel-chapter-select" class="chapter-label">Chapter</label>
    <select
      id="novel-chapter-select"
      class="chapter-select"
      :value="selectedChapterId"
      @change="emit('select', $event.target.value)"
      aria-label="Select chapter"
    >
      <option
        v-for="ch in chapters"
        :key="ch._id"
        :value="ch._id"
      >
        Chapter {{ ch.chapterNumber }}: {{ ch.title || 'Untitled' }}
      </option>
    </select>
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

.chapter-select {
  padding: 0.45rem 2rem 0.45rem 0.75rem;
  border: 1px solid var(--novel-border);
  border-radius: 6px;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  font-size: 0.9rem;
  cursor: pointer;
  appearance: auto;
  max-width: 100%;
}

.chapter-select:hover { border-color: var(--novel-accent); }
</style>
