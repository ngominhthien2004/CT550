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
  <section class="page d-grid gap-3">
    <h2 class="mb-0">Artwork Comments</h2>
    <div class="row g-2">
      <div class="col-12 col-lg-3">
        <input :value="artworkId" class="form-control bg-light" disabled />
      </div>
      <div class="col-12 col-lg-7">
        <input v-model="content" class="form-control" placeholder="Write a comment..." />
      </div>
      <div class="col-12 col-lg-2 d-grid">
        <button class="btn btn-primary" @click="submitComment">Add comment</button>
      </div>
    </div>
    <p v-if="commentStore.loading" class="text-secondary mb-0">Loading comments...</p>
    <p v-else-if="commentStore.error" class="text-danger mb-0">{{ commentStore.error }}</p>
    <CommentList v-else :comments="commentStore.items" :can-delete="true" @delete="removeComment" />
  </section>
</template>

<style scoped>
.page {
  padding: 0.25rem 0;
}
</style>
