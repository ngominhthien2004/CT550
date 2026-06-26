<script setup>
import { computed } from 'vue'
import ArtworkCard from '../ArtworkCard.vue'
import NovelRelatedCard from './NovelRelatedCard.vue'

const props = defineProps({
  relatedWorks: {
    type: Array,
    default: () => [],
  },
})

const gridGroups = computed(() => {
  const result = []
  const items = props.relatedWorks || []
  for (let i = 0; i < items.length; i += 6) {
    result.push(items.slice(i, i + 6))
  }
  return result
})
</script>

<template>
  <section class="related-shell">
    <header class="related-head">
      <h2 class="related-heading">Recommended works</h2>
    </header>

    <template v-if="!relatedWorks.length">
      <p class="text-secondary small mb-0">No related works yet.</p>
    </template>

    <template v-else>
      <div
        v-for="(group, gi) in gridGroups"
        :key="gi"
        class="related-group"
        :class="{ 'has-divider': gi < gridGroups.length - 1 }"
      >
        <div class="related-grid">
          <template v-for="item in group" :key="item._id">
            <NovelRelatedCard
              v-if="item.type === 'novel'"
              :item="item"
            />
            <div v-else class="artwork-cell">
              <ArtworkCard :item="item" />
            </div>
          </template>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.related-shell {
  width: 100%;
}

.related-head {
  margin-bottom: 0.6rem;
}

.related-heading {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
}

.related-group {
  padding: 1rem 0;
}

.related-group.has-divider {
  border-bottom: 1px solid var(--line);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.2rem 1.5rem;
}

.artwork-cell {
  min-width: 0;
}

@media (max-width: 900px) {
  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 550px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
