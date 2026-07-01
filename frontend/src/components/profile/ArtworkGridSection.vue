<script setup>
import { computed } from 'vue'
import ArtworkCard from '../artwork/ArtworkCard.vue'
import BookmarkCard from '../artwork/BookmarkCard.vue'
import SkeletonLoader from '../common/SkeletonLoader.vue'

const props = defineProps({
  heading: { type: String, default: 'Works' },
  showFeatured: { type: Boolean, default: false },
  tabs: { type: Array, default: () => [] },
  activeType: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  emptyIcon: { type: String, default: 'fa-regular fa-images' },
  emptyText: { type: String, default: 'No items found.' },
  hasMore: { type: Boolean, default: false },
  limit: { type: Number, default: 24 },
  nestedField: { type: String, default: '' },
  previewLimit: { type: Number, default: 8 },
  cardType: { type: String, default: 'artwork' },
})

const emit = defineEmits(['select-type', 'show-all', 'load-more'])

const totalCount = computed(() => {
  return props.tabs.reduce((sum, tab) => sum + tab.count, 0)
})

const displayItems = computed(() => {
  let list = props.items

  if (props.nestedField) {
    list = list
      .map((item) => {
        const nested = props.nestedField.split('.').reduce((obj, key) => obj?.[key], item)
        return nested || item
      })
      .filter(Boolean)
  }

  if (props.showFeatured) {
    return list.slice(0, props.previewLimit)
  }

  return list
})

const filteredCount = computed(() => props.items.length)
</script>

<template>
  <section class="artwork-grid-section" :aria-label="heading">
    <!-- Type filter tabs (pills) -->
    <div v-if="tabs.length" class="type-tabs" role="tablist" aria-label="Type filter tabs">
      <button
        type="button"
        class="type-tab"
        :class="{ active: activeType === '' }"
        role="tab"
        :aria-selected="activeType === ''"
        @click="emit('select-type', '')"
      >
        All <span class="type-count">{{ totalCount }}</span>
      </button>
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="type-tab"
        :class="{ active: tab.value === activeType }"
        role="tab"
        :aria-selected="tab.value === activeType"
        @click="emit('select-type', tab.value)"
      >
        {{ tab.label }} <span class="type-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Header -->
    <div class="section-header">
      <div class="section-heading">
        <h3>{{ heading }}</h3>
        <span v-if="filteredCount" class="section-badge">{{ filteredCount }}</span>
      </div>
      <span v-if="activeType" class="filter-note">{{ activeType }}</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading && !displayItems.length" class="section-note">
      <SkeletonLoader type="card" :count="6" />
    </div>
    <p v-else-if="loading && displayItems.length" class="section-note subtle">Loading...</p>

    <!-- Error state -->
    <p v-else-if="error" class="section-note error">{{ error }}</p>

    <!-- Grid -->
    <div v-else-if="displayItems.length" class="artwork-grid" :class="{ compact: showFeatured }">
      <BookmarkCard v-if="cardType === 'bookmark'" v-for="item in displayItems" :key="item._id" :item="item" />
      <ArtworkCard v-else v-for="item in displayItems" :key="item._id" :item="item" />
    </div>

    <!-- Empty state -->
    <div v-else class="section-empty">
      <i :class="emptyIcon" aria-hidden="true"></i>
      <p>{{ emptyText }}</p>
    </div>

    <!-- Show All button (home tab preview) -->
    <button
      v-if="showFeatured && items.length > previewLimit"
      type="button"
      class="show-all-btn"
      @click="emit('show-all')"
    >
      Show all
    </button>

    <!-- Load More button -->
    <button
      v-if="hasMore && !showFeatured"
      type="button"
      class="load-more-btn"
      :disabled="loading"
      @click="emit('load-more')"
    >
      {{ loading ? 'Loading...' : 'Load More' }}
    </button>
  </section>
</template>

<style scoped>
.artwork-grid-section {
  padding-top: 2rem;
  display: grid;
  gap: 1rem;
}

.type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-tab {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.42rem 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

.type-tab.active {
  border-color: var(--accent-line, #93c5fd);
  color: var(--accent, #0369a1);
  background: var(--accent-bg, #e0f2fe);
}

.type-count {
  font-size: 0.72rem;
  color: var(--muted);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.05rem;
}

.section-badge {
  min-width: 1.3rem;
  height: 1.3rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
}

.filter-note {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: capitalize;
}

.section-note {
  margin: 0;
  color: var(--muted);
}

.section-note.error {
  color: var(--danger, #dc2626);
}

.section-note.subtle {
  font-size: 0.85rem;
  font-weight: 600;
}

.artwork-grid {
  display: grid;
  gap: 1rem 0.9rem;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.section-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: var(--muted);
}

.section-empty i {
  font-size: 1.4rem;
}

.section-empty p {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.show-all-btn {
  width: min(620px, 100%);
  margin: 0.55rem auto 0;
  border: none;
  border-radius: 999px;
  background: var(--text);
  color: var(--surface);
  padding: 0.88rem 1.2rem;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
}

.load-more-btn {
  width: min(400px, 100%);
  margin: 0.5rem auto;
  border: 2px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  padding: 0.7rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--surface-alt);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.show-all-btn:hover {
  opacity: 0.9;
}

@media (max-width: 1240px) {
  .artwork-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .artwork-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
