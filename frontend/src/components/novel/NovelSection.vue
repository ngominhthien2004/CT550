<script setup>
import NovelCard from './NovelCard.vue'

defineProps({
  sectionId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  linkTo: {
    type: [String, Object],
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'No novels are available for this section yet.',
  },
})
</script>

<template>
  <section :id="sectionId" class="novel-editorial-section">
    <header class="novel-editorial-head">
      <div class="novel-editorial-copy">
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>

      <router-link v-if="linkTo" :to="linkTo" class="novel-editorial-link">Show all</router-link>
    </header>

    <p v-if="!items.length" class="novel-editorial-empty">{{ emptyText }}</p>

    <div v-else class="novel-editorial-list">
      <NovelCard
        v-for="(item, index) in items"
        :key="item._id || index"
        :item="item"
      />
    </div>
  </section>
</template>

<style scoped>
.novel-editorial-section {
  display: grid;
  gap: 0.85rem;
}

.novel-editorial-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.65rem;
}

.novel-editorial-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.novel-editorial-copy h3 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.3;
}

.novel-editorial-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.novel-editorial-link {
  flex: 0 0 auto;
  color: var(--accent);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.84rem;
}

.novel-editorial-link:hover {
  text-decoration: underline;
}

.novel-editorial-empty {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: var(--surface);
  border: 1px dashed var(--line);
  color: var(--muted);
}

.novel-editorial-list {
  display: grid;
  gap: 0.72rem;
}
</style>
