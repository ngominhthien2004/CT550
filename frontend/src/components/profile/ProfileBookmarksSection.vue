<script setup>
const objectIdPattern = /^[0-9a-fA-F]{24}$/

defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  activeType: {
    type: String,
    default: '',
  },
  bookmarks: {
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

function hasArtworkRoute(bookmark) {
  return typeof bookmark?.artwork?._id === 'string' && objectIdPattern.test(bookmark.artwork._id)
}
</script>

<template>
  <section class="bookmarks-panel" aria-label="Bookmarks section">
    <div v-if="tabs.length" class="bookmark-type-tabs" role="tablist" aria-label="Bookmark type tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="bookmark-type-tab"
        :class="{ active: tab.value === activeType }"
        role="tab"
        :aria-selected="tab.value === activeType"
        @click="emit('select-type', tab.value)"
      >
        {{ tab.label }}
        <span>{{ tab.count }}</span>
      </button>
    </div>

    <div class="bookmarks-head">
      <h3>Bookmarks</h3>
      <span class="small text-secondary">Saved from your favorite works</span>
    </div>

    <p v-if="loading" class="bm-note">Loading bookmarks...</p>
    <p v-else-if="error" class="bm-note error">{{ error }}</p>

    <div v-else-if="bookmarks.length" class="bookmark-grid">
      <article v-for="bookmark in bookmarks" :key="bookmark._id" class="bookmark-card">
        <router-link v-if="hasArtworkRoute(bookmark)" :to="`/artworks/${bookmark.artwork._id}`" class="bookmark-thumb-link">
          <img :src="bookmark.artwork?.images?.[0] || ''" :alt="bookmark.artwork?.title || 'Artwork'" loading="lazy" />
        </router-link>
        <img v-else :src="bookmark.artwork?.images?.[0] || ''" :alt="bookmark.artwork?.title || 'Artwork'" loading="lazy" />
        <router-link v-if="hasArtworkRoute(bookmark)" :to="`/artworks/${bookmark.artwork._id}`" class="bookmark-title">
          {{ bookmark.artwork?.title || 'Untitled' }}
        </router-link>
        <p class="bookmark-folder">Folder: {{ bookmark.folder || 'default' }}</p>
      </article>
    </div>

    <div v-else class="bookmark-empty">
      <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
      <p>No bookmark found.</p>
    </div>
  </section>
</template>

<style scoped>
.bookmarks-panel {
  padding-top: 1.2rem;
  display: grid;
  gap: 0.9rem;
}

.bookmark-type-tabs {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.bookmark-type-tab {
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

.bookmark-type-tab.active {
  border-color: #93c5fd;
  color: #0369a1;
  background: #e0f2fe;
}

.bookmarks-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.bookmarks-head h3 {
  margin: 0;
  font-size: 1.32rem;
}

.bm-note {
  margin: 0;
  color: #6b7280;
}

.bm-note.error {
  color: #dc2626;
}

.bookmark-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.bookmark-card {
  display: grid;
  gap: 0.2rem;
}

.bookmark-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  background: #f1f5f9;
}

.bookmark-title {
  text-decoration: none;
  color: #111827;
  font-size: 0.82rem;
  font-weight: 700;
}

.bookmark-folder {
  margin: 0;
  color: #6b7280;
  font-size: 0.72rem;
}

.bookmark-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: #b4bac5;
}

.bookmark-empty i {
  font-size: 1.4rem;
}

.bookmark-empty p {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 1240px) {
  .bookmark-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .bookmark-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
