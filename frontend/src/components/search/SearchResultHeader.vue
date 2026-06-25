<script setup>
import { computed } from 'vue'
import TagStrip from '../shared/TagStrip.vue'

const props = defineProps({
  keyword: { type: String, required: true },
  resultTotal: { type: Number, required: true },
  isUserSearch: { type: Boolean, default: false },
  isNovelSearch: { type: Boolean, default: false },
  showTags: { type: Boolean, default: true },
  displayTags: { type: Array, default: () => [] },
})

const emit = defineEmits(['toggle-tags', 'search-tag'])

const hashedDisplayTags = computed(() => props.displayTags.map(tag => `#${tag}`))
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

  <TagStrip
    v-if="!isUserSearch && showTags && hashedDisplayTags.length"
    :tags="hashedDisplayTags"
    variant="button"
    @tag-click="(tag) => emit('search-tag', tag)"
  />
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

</style>
