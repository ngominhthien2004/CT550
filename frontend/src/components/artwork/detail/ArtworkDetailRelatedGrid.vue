<script setup>
import ArtworkCard from '../ArtworkCard.vue'

defineProps({
  relatedWorks: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="related-shell d-grid gap-3">
    <header class="d-flex align-items-center justify-content-between">
      <h2 class="h5 fw-bold mb-0">Related works</h2>
    </header>

    <div class="related-grid">
      <ArtworkCard
        v-for="item in relatedWorks"
        :key="item._id"
        :item="item"
      />
    </div>

    <p v-if="!relatedWorks.length" class="text-secondary small mb-0">No related works yet.</p>
  </section>
</template>

<style scoped>
.related-shell {
  width: 100%;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1.5rem 1rem;
}

.related-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.related-card:hover {
  transform: translateY(-2px);
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-alt);
  border: 1px solid var(--line);
}

.related-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay-icons {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.related-card:hover .overlay-icons {
  opacity: 1;
}

.related-title {
  font-size: 0.85rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-line {
  font-size: 0.75rem;
}

.author-avatar-mini {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-alt);
  flex-shrink: 0;
  overflow: hidden;
}

.author-avatar-mini img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.author-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .related-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .related-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
