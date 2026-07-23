<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  artworks: { type: Array, required: true },
})

const emit = defineEmits(['select'])
const { t } = useI18n()
</script>

<template>
  <div class="series-works-section">
    <h2 class="section-title">{{ $t('series.worksInSeries') }}</h2>
    <div v-if="artworks.length > 0" class="artworks-grid">
      <div
        v-for="artwork in artworks"
        :key="artwork._id"
        class="artwork-card"
        @click="emit('select', artwork._id)"
        @keydown.enter.prevent="emit('select', artwork._id)"
        @keydown.space.prevent="emit('select', artwork._id)"
        tabindex="0"
        role="button"
      >
        <div class="artwork-card-thumb">
          <img
            v-if="artwork.images?.length > 0"
            :src="artwork.images[0]?.thumbnail || artwork.images[0]"
            :alt="artwork.title"
            loading="lazy"
          />
          <div v-else class="artwork-card-nothumb">
            <i :class="artwork._icon"></i>
          </div>
        </div>
        <div class="artwork-card-title">{{ artwork.title }}</div>
        <div class="artwork-card-meta">
          <span v-if="artwork.viewCount !== undefined">{{ artwork.viewCount }} {{ $t('series.views') }}</span>
        </div>
      </div>
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

.artwork-card {
  background: var(--surface);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.artwork-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.artwork-card-thumb {
  aspect-ratio: 1;
  background: var(--surface-alt);
  overflow: hidden;
}

.artwork-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-card-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--line);
  font-size: 2rem;
}

.artwork-card-title {
  padding: 0.5rem 0.65rem 0.25rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--brand);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artwork-card-meta {
  padding: 0 0.65rem 0.5rem;
  font-size: 0.72rem;
  color: var(--muted);
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
