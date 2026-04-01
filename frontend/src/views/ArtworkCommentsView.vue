<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCommentStore } from '../stores/comment.store'
import CommentList from '../components/comments/CommentList.vue'

const route = useRoute()
const commentStore = useCommentStore()
const artworkId = computed(() => route.params.id)

onMounted(() => {
  if (artworkId.value) {
    commentStore.fetchComments(artworkId.value)
  }
})
</script>

<template>
  <section class="page">
    <h2>Artwork Comments</h2>
    <p v-if="commentStore.loading">Loading comments...</p>
    <p v-else-if="commentStore.error">{{ commentStore.error }}</p>
    <CommentList v-else :comments="commentStore.items" />
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
</style>
