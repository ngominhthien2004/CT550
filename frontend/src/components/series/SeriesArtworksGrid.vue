<script setup>
import { useI18n } from 'vue-i18n'
import ArtworkCard from '@/components/artwork/ArtworkCard.vue'

defineProps({
  artworks: { type: Array, required: true },
})

const { t } = useI18n()
</script>

<template>
  <div class="series-works-section">
    <h2 class="section-title">{{ $t('series.worksInSeries') }}</h2>
    <div v-if="artworks.length > 0" class="artworks-grid">
      <ArtworkCard
        v-for="artwork in artworks"
        :key="artwork._id"
        :item="artwork"
        hide-series-badge
      />
    </div>
    <div v-else class="empty-section">
      <p>{{ $t('series.noWorksInSeries') }}</p>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 1rem;
}

.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.empty-section {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--surface);
  border-radius: 12px;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
