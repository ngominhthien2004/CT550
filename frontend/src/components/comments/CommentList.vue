<script setup>
defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ul class="comment-list">
    <li v-for="comment in comments" :key="comment._id" class="comment-item">
      <p class="author">{{ comment.user?.displayName || comment.user?.username }}</p>
      <p class="body">{{ comment.content }}</p>
    </li>
  </ul>
</template>

<style scoped>
.comment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.comment-item {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  padding: 0.85rem 0.95rem;
}

.author {
  margin: 0;
  font-weight: 700;
  font-size: 0.9rem;
}

.body {
  margin: 0.35rem 0 0;
  color: #374151;
}
</style>
