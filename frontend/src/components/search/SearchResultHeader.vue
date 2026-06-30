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
  showFavoriteTag: { type: Boolean, default: false },
  isFavoriteTag: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-tags', 'search-tag', 'toggle-favorite'])

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
    <div v-if="!isUserSearch" class="result-header-actions">
      <button v-if="showFavoriteTag" type="button" class="favorite-tag-btn" :class="{ 'is-favorite': isFavoriteTag }" @click="emit('toggle-favorite')">
        {{ isFavoriteTag ? '★ Remove favorite' : '☆ Add to favorite tag' }}
      </button>
      <button type="button" class="show-tag-btn" @click="emit('toggle-tags')">
        {{ showTags ? 'Hide tag' : 'Show tag' }}
      </button>
    </div>
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
  color: var(--brand);
}

.search-result-page--users .result-header h1 {
  font-size: 1.45rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0;
}

.result-count-head {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.search-result-page--users .result-count-head {
  color: var(--muted);
  font-size: 1.08rem;
  font-weight: 500;
}

.search-result-page--users .result-count-head strong {
  color: var(--text);
  font-weight: 800;
}

.show-tag-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.88rem;
}

.result-header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.favorite-tag-btn {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.favorite-tag-btn:hover {
  background: var(--surface-alt);
  border-color: var(--accent);
}

.favorite-tag-btn.is-favorite {
  background: rgba(234, 179, 8, 0.15);
  border-color: #eab308;
  color: #eab308;
}

</style>
