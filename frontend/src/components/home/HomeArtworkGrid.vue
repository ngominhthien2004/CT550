<script setup>
import ArtworkCard from '../artwork/ArtworkCard.vue'

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
      <div>
        <h3>Recommended works</h3>
        <p class="section-copy">A denser artwork strip, closer to the Pixiv thumbnail rhythm.</p>
      </div>
      <router-link to="/discovery">View all</router-link>
    </header>

    <p v-if="!works.length" class="empty-state mb-0">
      Chua co artwork moi nhat de hien thi. Hay dang artwork dau tien de Home co noi dung.
    </p>

    <div v-else class="work-grid">
      <ArtworkCard v-for="work in works" :key="work._id || work.id" :item="work" class="work-card-override" />
    </div>
  </section>
</template>

<style scoped>
.latest-section {
  display: grid;
  gap: 0.9rem;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 18px;
  padding: 0.9rem;
  color: var(--muted);
  background: #fff;
}

.section-copy {
  margin-top: 0.16rem;
  color: #68758c;
  font-size: 0.84rem;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.8rem 0.72rem;
}

.work-card-override {
  transition: transform 0.16s ease;
}

.work-card-override:hover {
  transform: translateY(-2px);
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
