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
  <ul class="list-group">
    <li v-for="comment in comments" :key="comment._id" class="list-group-item py-3">
      <div class="d-flex align-items-center justify-content-between gap-3">
        <p class="author mb-0">{{ comment.user?.displayName || comment.user?.username }}</p>
        <button
          v-if="canDelete"
          class="btn btn-sm btn-outline-danger"
          @click="$emit('delete', comment._id)"
        >
          Delete
        </button>
      </div>
      <p class="body mb-0 mt-2">{{ comment.content }}</p>
    </li>
  </ul>
</template>

<style scoped>
.author {
  font-weight: 700;
  font-size: 0.9rem;
}

.body {
  color: #374151;
}
</style>
