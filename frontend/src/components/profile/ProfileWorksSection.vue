<script setup>
const objectIdPattern = /^[0-9a-fA-F]{24}$/
const HOME_PREVIEW_LIMIT = 8

const props = defineProps({
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

const emit = defineEmits(['select-type', 'show-all'])

function hasDetailRoute(artwork) {
  return typeof artwork?._id === 'string' && objectIdPattern.test(artwork._id)
}

function visibleItems() {
  if (!props.showFeatured) {
    return props.artworks
  }
  return props.artworks.slice(0, HOME_PREVIEW_LIMIT)
}
</script>

<template>
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
      <div class="works-heading">
        <h3>{{ heading }}</h3>
        <span v-if="artworks.length" class="works-badge">{{ artworks.length }}</span>
      </div>
      <span v-if="activeType" class="filter-note">{{ activeType }}</span>
    </div>

    <p v-if="loading" class="works-note">Loading artworks...</p>
    <p v-else-if="error" class="works-note error">{{ error }}</p>

    <div v-else-if="artworks.length" class="works-grid" :class="{ compact: showFeatured }">
      <article v-for="artwork in visibleItems()" :key="artwork._id" class="work-card">
        <router-link v-if="hasDetailRoute(artwork)" :to="`/artworks/${artwork._id}`" class="work-cover-link">
          <img :src="artwork.image" :alt="artwork.title" loading="lazy" />
          <span class="work-heart" aria-hidden="true">
            <i class="fa-regular fa-heart"></i>
          </span>
        </router-link>
        <div v-else class="work-image-wrap">
          <img :src="artwork.image" :alt="artwork.title" loading="lazy" />
          <span class="work-heart" aria-hidden="true">
            <i class="fa-regular fa-heart"></i>
          </span>
        </div>
        <router-link v-if="hasDetailRoute(artwork)" :to="`/artworks/${artwork._id}`" class="work-title-link">{{ artwork.title }}</router-link>
        <p class="work-author">{{ artwork.user?.displayName || artwork.user?.username || 'Unknown' }}</p>
      </article>
    </div>

    <section v-else class="works-empty" aria-label="Works list empty state">
      <i class="fa-regular fa-images" aria-hidden="true"></i>
      <p>No works found.</p>
    </section>

    <button
      v-if="showFeatured && artworks.length > HOME_PREVIEW_LIMIT"
      type="button"
      class="show-all-btn"
      @click="emit('show-all')"
    >
      Show all
    </button>
  </section>
</template>

<style scoped>
.works-panel {
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
  border: 1px solid #dbe4ef;
  border-radius: 999px;
  background: #fff;
  color: #4b5563;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.42rem 0.82rem;
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
  gap: 0.8rem;
}

.works-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.works-header h3 {
  margin: 0;
  font-size: 1.05rem;
}

.works-badge {
  min-width: 1.3rem;
  height: 1.3rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #e5e7eb;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
}

.filter-note {
  color: #6b7280;
  font-size: 0.8rem;
  text-transform: capitalize;
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
  gap: 1rem 0.9rem;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.works-grid.compact {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.work-card {
  display: grid;
  gap: 0.34rem;
  align-content: start;
}

.work-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  object-fit: cover;
  background: #f3f4f6;
}

.work-cover-link,
.work-image-wrap {
  display: block;
  position: relative;
}

.work-heart {
  position: absolute;
  right: 0.45rem;
  bottom: 0.45rem;
  width: 1.95rem;
  height: 1.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
  font-size: 0.88rem;
}

.work-title-link {
  text-decoration: none;
  color: #111827;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.35;
}

.work-author {
  margin: 0;
  color: #6b7280;
  font-size: 0.78rem;
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

.show-all-btn {
  width: min(620px, 100%);
  margin: 0.55rem auto 0;
  border: none;
  border-radius: 999px;
  background: #171717;
  color: #fff;
  padding: 0.88rem 1.2rem;
  font-size: 0.96rem;
  font-weight: 700;
}

@media (max-width: 1240px) {
  .works-grid,
  .works-grid.compact {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .works-grid,
  .works-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
