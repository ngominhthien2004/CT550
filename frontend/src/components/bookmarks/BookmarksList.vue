<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ul class="bookmark-list">
    <li v-for="bookmark in items" :key="bookmark._id" class="bookmark-item">
      <strong>{{ bookmark.artwork?.title || 'Untitled artwork' }}</strong>
      <span>{{ bookmark.folder || 'default' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.bookmark-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.bookmark-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--line);
  background: #fff;
  padding: 0.8rem 1rem;
  border-radius: 12px;
}

.bookmark-item span {
  color: #6b7280;
  font-size: 0.9rem;
}
</style>
