<script setup>
import { useI18n } from 'vue-i18n'
import ArtworkCard from '@/components/artwork/ArtworkCard.vue'

defineProps({
  artworks: { type: Array, required: true },
  isOwner: { type: Boolean, default: false },
})

defineEmits(['add-artwork'])

const { t } = useI18n()
</script>

<template>
  <div class="series-works-section">
    <h2 class="section-title">{{ $t('series.worksInSeries') }}</h2>
    <div v-if="artworks.length > 0 || isOwner" class="artworks-grid">
      <ArtworkCard
        v-for="artwork in artworks"
        :key="artwork._id"
        :item="artwork"
        hide-series-badge
      />
      <button
        v-if="isOwner"
        type="button"
        class="add-work-card"
        :aria-label="$t('series.addWork')"
        @click="$emit('add-artwork')"
      >
        <span class="add-work-icon"><i class="fa-solid fa-plus"></i></span>
        <span class="add-work-label">{{ $t('series.addWork') }}</span>
      </button>
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

.add-work-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  aspect-ratio: 1 / 1;
  border: 2px dashed var(--line);
  border-radius: 10px;
  background: var(--surface-alt);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  padding: 1rem;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.add-work-card:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--surface);
}

.add-work-icon {
  font-size: 2rem;
  line-height: 1;
}

.add-work-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
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
