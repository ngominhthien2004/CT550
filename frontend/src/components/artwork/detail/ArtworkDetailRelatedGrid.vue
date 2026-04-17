<script setup>
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
      <router-link
        v-for="item in relatedWorks"
        :key="item._id"
        :to="`/artworks/${item._id}`"
        class="related-card text-decoration-none"
      >
        <div class="image-wrapper">
          <img v-if="item.images?.[0]" class="related-cover" :src="item.images[0]" :alt="item.title" loading="lazy" />
          <div class="overlay-icons">
            <i class="fa-solid fa-heart shadow-sm"></i>
          </div>
        </div>
        
        <div class="card-info d-grid gap-1 mt-2">
          <span class="related-title fw-semibold">{{ item.title }}</span>
          <div class="author-line d-flex align-items-center gap-2">
            <div class="author-avatar-mini" aria-hidden="true"></div>
            <span class="author-name text-secondary">{{ item.user?.username || 'Artist' }}</span>
          </div>
        </div>
      </router-link>
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  color: #1a1a1a;
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
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  flex-shrink: 0;
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
