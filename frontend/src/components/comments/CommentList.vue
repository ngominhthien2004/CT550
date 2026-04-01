<script setup>
defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['delete'])
</script>

<template>
  <ul class="comment-list">
    <li v-for="comment in comments" :key="comment._id" class="comment-item">
      <div class="head">
        <p class="author">{{ comment.user?.displayName || comment.user?.username }}</p>
        <button v-if="canDelete" class="delete-btn" @click="$emit('delete', comment._id)">Delete</button>
      </div>
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

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.delete-btn {
  border: 1px solid var(--line);
  background: #fff;
  color: #b91c1c;
  border-radius: 8px;
  padding: 0.2rem 0.45rem;
  font-size: 0.78rem;
  cursor: pointer;
}

.body {
  margin: 0.35rem 0 0;
  color: #374151;
}
</style>
