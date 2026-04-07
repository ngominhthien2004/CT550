<script setup>
const objectIdPattern = /^[0-9a-fA-F]{24}$/

defineProps({
  heading: {
    type: String,
    default: 'Works',
  },
  showFeatured: {
    type: Boolean,
    default: true,
  },
  tabs: {
    type: Array,
    default: () => [],
  },
  activeType: {
    type: String,
    default: '',
  },
  artworks: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-type'])

function hasDetailRoute(artwork) {
  return typeof artwork?._id === 'string' && objectIdPattern.test(artwork._id)
}
</script>

<template>
  <div class="content-grid">
    <section v-if="showFeatured" class="featured-panel" aria-labelledby="featured-title">
      <div class="featured-header">
        <h2 id="featured-title">Featured</h2>
        <button type="button" class="featured-settings">Featured settings</button>
      </div>

      <button type="button" class="featured-card" aria-label="Add featured artwork">
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
        <span>Add Featured</span>
      </button>
    </section>

    <section class="works-panel" aria-label="Works section">
      <div v-if="tabs.length" class="type-tabs" role="tablist" aria-label="Artwork type tabs">
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
          {{ tab.label }}
          <span class="type-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="works-header">
        <h3>{{ heading }}</h3>
        <span v-if="activeType" class="filter-note">Filter: {{ activeType }}</span>
      </div>

      <p v-if="loading" class="works-note">Loading artworks...</p>
      <p v-else-if="error" class="works-note error">{{ error }}</p>

      <div v-else-if="artworks.length" class="works-grid">
        <article v-for="artwork in artworks" :key="artwork._id" class="work-card">
          <router-link v-if="hasDetailRoute(artwork)" :to="`/artworks/${artwork._id}`" class="work-cover-link">
            <img :src="artwork.image" :alt="artwork.title" loading="lazy" />
          </router-link>
          <img v-else :src="artwork.image" :alt="artwork.title" loading="lazy" />
          <router-link v-if="hasDetailRoute(artwork)" :to="`/artworks/${artwork._id}`" class="work-title-link">{{ artwork.title }}</router-link>
          <p class="work-author">{{ artwork.user?.username || artwork.user?.displayName || 'Unknown' }}</p>
        </article>
      </div>

      <section v-else class="works-empty" aria-label="Works list empty state">
        <i class="fa-regular fa-images" aria-hidden="true"></i>
        <p>No works found.</p>
      </section>
    </section>
  </div>
</template>

<style scoped>
.content-grid {
  padding-top: 2rem;
  display: grid;
  gap: 1.6rem;
}

.featured-panel {
  display: grid;
  gap: 0.8rem;
}

.featured-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.featured-header h2 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  color: #273346;
}

.featured-settings {
  border: none;
  background: transparent;
  color: #b2b9c4;
  font-size: 0.72rem;
}

.featured-card {
  width: 150px;
  height: 150px;
  border: 1px solid #eff1f4;
  background: #f8f9fb;
  color: #8993a2;
  border-radius: 4px;
  display: grid;
  place-items: center;
  gap: 0.15rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.featured-card i {
  font-size: 1.5rem;
}

.type-tabs {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.65rem;
}

.type-tab {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f8fafc;
  color: #4b5563;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.type-tab.active {
  border-color: #93c5fd;
  color: #0369a1;
  background: #e0f2fe;
}

.type-count {
  font-size: 0.72rem;
  color: #6b7280;
}

.works-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}

.works-header h3 {
  margin: 0;
  font-size: 1.35rem;
}

.filter-note {
  color: #6b7280;
  font-size: 0.8rem;
}

.works-note {
  margin: 0;
  color: #6b7280;
}

.works-note.error {
  color: #dc2626;
}

.works-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.work-card {
  display: grid;
  gap: 0.2rem;
}

.work-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  object-fit: cover;
  background: #f3f4f6;
}

.work-cover-link {
  display: block;
}

.work-title-link {
  text-decoration: none;
  color: #111827;
  font-size: 0.82rem;
  font-weight: 700;
}

.work-author {
  margin: 0;
  color: #6b7280;
  font-size: 0.72rem;
}

.works-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  color: #b4bac5;
}

.works-empty i {
  font-size: 1.55rem;
}

.works-empty p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

@media (max-width: 1240px) {
  .works-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .works-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
