<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ul class="feed-list">
    <li v-for="item in items" :key="item._id" class="feed-card">
      <div class="feed-thumb" />
      <div class="feed-meta">
        <h3>{{ item.title }}</h3>
        <p>by {{ item.user?.displayName || item.user?.username }}</p>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.9rem;
}

.feed-card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.8rem;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
}

.feed-thumb {
  min-height: 88px;
  background: linear-gradient(135deg, #8bd3ff, #ffd27f);
}

.feed-meta {
  padding: 0.8rem;
}

.feed-meta h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.feed-meta p {
  margin: 0;
  color: #4b5563;
  font-size: 0.92rem;
}
</style>
