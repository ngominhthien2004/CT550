<script setup>
const objectIdPattern = /^[0-9a-fA-F]{24}$/

defineProps({
  works: {
    type: Array,
    default: () => [],
  },
})

function hasArtworkDetailRoute(work) {
  const artworkId = work?._id || work?.id
  return typeof artworkId === 'string' && objectIdPattern.test(artworkId)
}
</script>

<template>
  <section class="latest-section">
    <header class="section-head">
      <h3>Recommended works</h3>
      <router-link to="/feed">View all</router-link>
    </header>

    <p v-if="!works.length" class="empty-state mb-0">
      Chua co artwork moi nhat de hien thi. Hay dang artwork dau tien de Home co noi dung.
    </p>

    <div v-else class="work-grid">
      <article v-for="work in works" :key="work._id || work.id" class="work-card">
        <router-link
          v-if="hasArtworkDetailRoute(work)"
          :to="`/artworks/${work._id || work.id}`"
          class="work-cover-link"
        >
          <img :src="work.image" :alt="work.title" loading="lazy" />
        </router-link>
        <img v-else :src="work.image" :alt="work.title" loading="lazy" />
        <div class="work-meta">
          <router-link v-if="hasArtworkDetailRoute(work)" :to="`/artworks/${work._id || work.id}`" class="work-title-link">
            <strong>{{ work.title }}</strong>
          </router-link>
          <strong v-else>{{ work.title }}</strong>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.latest-section {
  display: grid;
  gap: 0.75rem;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 0.9rem;
  color: var(--muted);
  background: #fff;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
}

.work-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.work-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: cover;
}

.work-cover-link {
  display: block;
}

.work-meta {
  padding: 0.55rem;
  display: grid;
  gap: 0;
  font-size: 0.86rem;
}

.work-title-link {
  text-decoration: none;
  color: inherit;
}

@media (max-width: 1200px) {
  .work-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
