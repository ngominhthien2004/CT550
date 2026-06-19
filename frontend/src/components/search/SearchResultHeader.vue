<script setup>
defineProps({
  keyword: { type: String, required: true },
  resultTotal: { type: Number, required: true },
  isUserSearch: { type: Boolean, default: false },
  isNovelSearch: { type: Boolean, default: false },
  showTags: { type: Boolean, default: true },
  displayTags: { type: Array, default: () => [] },
})

const emit = defineEmits(['toggle-tags', 'search-tag'])
</script>

<template>
  <header class="result-header">
    <div class="result-title-stack">
      <h1>{{ keyword }}</h1>
      <p class="result-count-head">
        <strong v-if="isUserSearch">{{ resultTotal.toLocaleString() }}</strong>
        <template v-else>{{ resultTotal.toLocaleString() }}</template>
        {{ isUserSearch ? 'Accounts' : isNovelSearch ? 'novels' : 'works' }}
      </p>
    </div>
    <button v-if="!isUserSearch" type="button" class="show-tag-btn" @click="emit('toggle-tags')">
      {{ showTags ? 'Hide tag' : 'Show tag' }}
    </button>
  </header>

  <div class="tag-strip" v-if="!isUserSearch && showTags && displayTags.length">
    <button
      v-for="tag in displayTags"
      :key="tag"
      type="button"
      class="tag-chip"
      @click="emit('search-tag', tag)"
    >
      #{{ tag }}
    </button>
  </div>
</template>

<style scoped>
.result-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.result-title-stack {
  display: flex;
  align-items: baseline;
  gap: 0.72rem;
  min-width: 0;
}

.search-result-page--users .result-title-stack {
  display: grid;
  align-items: start;
  gap: 0.48rem;
}

.result-header h1 {
  margin: 0;
  text-transform: lowercase;
  font-size: 2rem;
  color: #111827;
}

.search-result-page--users .result-header h1 {
  font-size: 1.45rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0;
}

.result-count-head {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
}

.search-result-page--users .result-count-head {
  color: #6b7280;
  font-size: 1.08rem;
  font-weight: 500;
}

.search-result-page--users .result-count-head strong {
  color: #334155;
  font-weight: 800;
}

.show-tag-btn {
  border: none;
  background: transparent;
  color: #475569;
  font-weight: 600;
  font-size: 0.88rem;
}

.tag-strip {
  display: flex;
  gap: 0.52rem;
  overflow: auto;
  padding-bottom: 0.3rem;
}

.tag-chip {
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 0.38rem 0.75rem;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 700;
}

.tag-chip:nth-child(5n + 1) { background: #94b96d; }
.tag-chip:nth-child(5n + 2) { background: #66b4b1; }
.tag-chip:nth-child(5n + 3) { background: #9a73c9; }
.tag-chip:nth-child(5n + 4) { background: #6f84c8; }
.tag-chip:nth-child(5n + 5) { background: #c48f75; }
</style>
