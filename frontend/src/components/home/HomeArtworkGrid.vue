<script setup>
defineProps({
  works: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="latest-section">
    <header class="section-head">
      <h3>Recommended works</h3>
      <router-link to="/feed">View all</router-link>
    </header>

    <div class="work-grid">
      <article v-for="work in works" :key="work.id" class="work-card">
        <img :src="work.image" :alt="work.title" loading="lazy" />
        <div class="work-meta">
          <strong>{{ work.title }}</strong>
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

.work-meta {
  padding: 0.55rem;
  display: grid;
  gap: 0;
  font-size: 0.86rem;
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
