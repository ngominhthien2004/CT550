<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCommentStore } from '../stores/comment.store'
import CommentList from '../components/comments/CommentList.vue'

const route = useRoute()
const commentStore = useCommentStore()
const artworkId = computed(() => route.params.id)
const content = ref('')

const submitComment = async () => {
  if (!artworkId.value || !content.value.trim()) {
    commentStore.error = 'Artwork id and comment content are required'
    return
  }
  await commentStore.addComment(artworkId.value, content.value.trim())
  content.value = ''
}

const removeComment = async (commentId) => {
  await commentStore.removeComment(commentId)
}

onMounted(() => {
  if (artworkId.value) {
    commentStore.fetchComments(artworkId.value)
  }
})
</script>

<template>
  <section class="page">
    <h2>Artwork Comments</h2>
    <div class="actions">
      <input :value="artworkId" disabled />
      <input v-model="content" placeholder="Write a comment..." />
      <button @click="submitComment">Add comment</button>
    </div>
    <p v-if="commentStore.loading">Loading comments...</p>
    <p v-else-if="commentStore.error">{{ commentStore.error }}</p>
    <CommentList v-else :comments="commentStore.items" :can-delete="true" @delete="removeComment" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 0.75rem;
}

h2 {
  margin: 0;
}

.actions {
  display: grid;
  grid-template-columns: minmax(160px, 220px) 1fr auto;
  gap: 0.5rem;
}

input,
button {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
}

input:disabled {
  background: #f8fafc;
  color: #64748b;
}

button {
  cursor: pointer;
  border-color: #0f172a;
  background: #0f172a;
  color: #fff;
  font-weight: 600;
}

@media (max-width: 880px) {
  .actions {
    grid-template-columns: 1fr;
  }
}
</style>
