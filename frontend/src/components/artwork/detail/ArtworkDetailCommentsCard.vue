<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCommentStore } from '../../../stores/comment.store.js'
import { useAuthStore } from '../../../stores/auth.store.js'

const props = defineProps({
  artworkId: {
    type: String,
    required: true,
  },
})

const commentStore = useCommentStore()
const authStore = useAuthStore()
const commentContent = ref('')
const isSubmitting = ref(false)

onMounted(() => {
  commentStore.fetchComments(props.artworkId)
})

const currentUserAvatar = computed(() => {
  return authStore.user?.avatar || '/default-avatar.png'
})

const handleSubmit = async () => {
  if (!commentContent.value.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  try {
    await commentStore.addComment(props.artworkId, commentContent.value)
    commentContent.value = ''
  } catch (error) {
    console.error('Failed to post comment:', error)
  } finally {
    isSubmitting.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const getAvatar = (user) => {
  if (user?.avatar) {
    // Check if relative path and prefix with backend URL if needed
    // For now assuming full URL or accessible path
    return user.avatar
  }
  return '/default-avatar.png'
}
</script>

<template>
  <div class="comments-section mt-5">
    <h3 class="section-title mb-4">Comments</h3>

    <!-- Input Area -->
    <div class="comment-input-row d-flex gap-3 mb-5">
      <img :src="currentUserAvatar" alt="User" class="user-avatar" />
      <div class="input-wrapper flex-grow-1 position-relative">
        <textarea
          v-model="commentContent"
          class="comment-textarea"
          placeholder="Leave a comment"
          rows="1"
          @keydown.enter.ctrl="handleSubmit"
        ></textarea>
        <button class="emoji-btn">
          <i class="far fa-smile"></i>
        </button>
      </div>
      <button 
        class="send-btn" 
        :disabled="!commentContent.trim() || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '...' : 'Send' }}
      </button>
    </div>

    <!-- Comment List -->
    <div v-if="commentStore.loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-muted"></div>
    </div>

    <div v-else class="comment-list d-grid gap-4">
      <div v-for="comment in commentStore.items" :key="comment._id" class="comment-item d-flex gap-3">
        <img :src="getAvatar(comment.user)" alt="Avatar" class="user-avatar" />
        <div class="comment-content flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div class="author-info flex-grow-1">
              <span class="user-name">{{ comment.user?.displayName || comment.user?.username }}</span>
              <p class="comment-text mt-1 mb-2">{{ comment.content }}</p>
              <div class="comment-meta d-flex align-items-center gap-3">
                <span class="comment-date text-muted">{{ formatDate(comment.createdAt) }}</span>
                <button class="btn-reply p-0 border-0 bg-transparent">Reply</button>
              </div>
            </div>
            <button class="options-btn">
              <i class="fas fa-ellipsis-h text-muted"></i>
            </button>
          </div>
          
          <!-- Placeholder for Replies -->
          <div class="mt-2 text-start">
            <button class="btn-display-replies py-1 px-3">
              Display Replies
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="commentStore.items.length === 0" class="text-center py-5 text-muted">
        No comments yet. Be the first to comment!
      </div>
    </div>
  </div>
</template>

<style scoped>
.comments-section {
  max-width: 100%;
  padding-bottom: 50px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f0f0;
}

.comment-input-row {
  align-items: center;
}

.input-wrapper {
  background-color: #f2f4f6;
  border-radius: 8px;
  padding: 10px 12px;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.input-wrapper:focus-within {
  background-color: #ebedef;
}

.comment-textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  resize: none;
  padding-right: 35px;
  line-height: 1.4;
}

.emoji-btn {
  position: absolute;
  right: 12px;
  border: none;
  background: transparent;
  color: #777;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.send-btn {
  background-color: #0096fa;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 8px 24px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 40px;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background-color: #007bd0;
}

.send-btn:disabled {
  background-color: #92d3ff;
  cursor: not-allowed;
}

/* Comment Item Styles */
.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #333;
  display: block;
}

.comment-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #1f1f1f;
  white-space: pre-wrap;
  margin: 0;
}

.comment-meta {
  font-size: 0.85rem;
}

.comment-date {
  color: #777;
}

.btn-reply {
  color: #3d7699;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-reply:hover {
  text-decoration: underline;
}

.options-btn {
  background: transparent;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-display-replies {
  border: none;
  background-color: #f2f4f6;
  color: #333;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-display-replies:hover {
  background-color: #e6e9ed;
}

.comment-item {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
