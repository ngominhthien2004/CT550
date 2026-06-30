<script setup>
defineProps({
  sortMode: { type: String, required: true },
  ageFilter: { type: String, required: true },
  currentSearchOptions: { type: Object, required: true },
  isNovelSearch: { type: Boolean, default: false },
  novelSortBy: { type: String, default: 'newest' },
  novelMinWords: { type: [String, Number], default: '' },
  novelMaxWords: { type: [String, Number], default: '' },
})

const emit = defineEmits(['update:sortMode', 'update:ageFilter', 'update:novelSortBy', 'update:novelMinWords', 'update:novelMaxWords'])
</script>

<template>
  <div class="filter-row">
    <label class="order-select">
      <select :value="sortMode" @change="emit('update:sortMode', $event.target.value)" aria-label="Sort by">
        <option value="newest">Newest</option>
        <option value="popular">Sort by popularity</option>
      </select>
    </label>
    <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'safe' }" @click="emit('update:ageFilter', 'safe')">All-Ages</button>
    <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'r18' }" @click="emit('update:ageFilter', 'r18')">R-18</button>
    <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'all' }" @click="emit('update:ageFilter', 'all')">All</button>
    <span class="include-note">Tag match mode: {{ currentSearchOptions.target === 'all' ? 'all fields' : currentSearchOptions.target }}</span>

    <template v-if="isNovelSearch">
      <span class="filter-separator" aria-hidden="true"></span>
      <label class="novel-sort-select">
        <select :value="novelSortBy" @change="emit('update:novelSortBy', $event.target.value)" aria-label="Novel sort by">
          <option value="newest">Newest</option>
          <option value="views">Most viewed</option>
          <option value="likes">Most liked</option>
          <option value="longest">Longest</option>
          <option value="shortest">Shortest</option>
        </select>
      </label>
      <label class="word-range-label">
        <input
          :value="novelMinWords"
          type="number"
          class="word-range-input"
          placeholder="Min words"
          min="0"
          aria-label="Min words"
          @input="emit('update:novelMinWords', $event.target.value)"
        />
        <span class="word-range-sep">–</span>
        <input
          :value="novelMaxWords"
          type="number"
          class="word-range-input"
          placeholder="Max words"
          min="0"
          aria-label="Max words"
          @input="emit('update:novelMaxWords', $event.target.value)"
        />
      </label>
    </template>
  </div>
</template>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.order-select {
  display: inline-flex;
  align-items: center;
}

.order-select select {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  font-size: 0.85rem;
  color: var(--text);
}

.filter-chip {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip:hover {
  border-color: var(--muted);
}

.filter-chip.is-active {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
}

.include-note {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--muted);
}

.filter-separator {
  width: 1px;
  height: 1.2rem;
  background: var(--line);
  margin: 0 0.25rem;
}

.novel-sort-select select {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  font-size: 0.85rem;
  color: var(--text);
}

.word-range-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.word-range-input {
  width: 5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 0.82rem;
  background: var(--surface);
  color: var(--text);
}

.word-range-sep {
  color: var(--muted);
}
</style>
