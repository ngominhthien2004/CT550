<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useCommentStore } from '../stores/comment.store'
import CommentList from '../components/comments/CommentList.vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const authStore = useAuthStore()
const commentStore = useCommentStore()
const artworkId = computed(() => route.params.id)
const content = ref('')
const isAdmin = computed(() => authStore.user?.role === 'admin')
const { t } = useI18n()

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
    <h2 class="mb-0">{{ $t('artwork.commentsTitle') }}</h2>
    <div class="row g-2">
      <div class="col-12 col-lg-3">
        <input :value="artworkId" class="form-control bg-light" disabled aria-label="Artwork ID" />
      </div>
      <div class="col-12 col-lg-7">
        <input v-model="content" class="form-control" :placeholder="$t('artwork.writeComment')" aria-label="Comment content" />
      </div>
      <div class="col-12 col-lg-2 d-grid">
        <button type="button" class="btn btn-primary" @click="submitComment">{{ $t('artwork.addComment') }}</button>
      </div>
    </div>
    <p v-if="commentStore.loading" class="text-secondary mb-0">{{ $t('artwork.loadingComments') }}</p>
    <p v-else-if="commentStore.error" class="text-danger mb-0">{{ commentStore.error }}</p>
    <CommentList v-else :comments="commentStore.items" :can-delete="isAdmin" @delete="removeComment" />
  </section>
</template>

<style scoped>
.page {
  padding: 0.25rem 0;
}
</style>
