<script setup>
import { ref, computed, watch } from 'vue'
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
const stickerUrl = ref('')
const showStickerInput = ref(false)
const isSubmitting = ref(false)
const expandedRepliesByCommentId = ref({})
const showReplyInputByCommentId = ref({})
const replyContentByCommentId = ref({})
const replyStickerUrlByCommentId = ref({})
const showReplyStickerInputByCommentId = ref({})
const submittingReplyByCommentId = ref({})

watch(
  () => props.artworkId,
  (artworkId) => {
    if (artworkId) {
      commentStore.fetchComments(artworkId)
    }
  },
  { immediate: true },
)

const currentUserAvatar = computed(() => {
  return authStore.user?.avatar || '/default-avatar.png'
})

const currentUserId = computed(() => authStore.user?._id || '')
const isAdmin = computed(() => authStore.user?.role === 'admin')

const canDeleteComment = (comment) => {
  if (!currentUserId.value) return false
  return isAdmin.value || comment?.user?._id === currentUserId.value
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  const normalizedContent = commentContent.value.trim()
  const normalizedStickerUrl = stickerUrl.value.trim()
  if (!normalizedContent && !normalizedStickerUrl) return

  isSubmitting.value = true
  try {
    await commentStore.addComment(props.artworkId, {
      content: normalizedContent,
      stickerUrl: normalizedStickerUrl,
    })
    commentContent.value = ''
    stickerUrl.value = ''
    showStickerInput.value = false
  } catch (_error) {
  } finally {
    isSubmitting.value = false
  }
}

const toggleStickerInput = () => {
  showStickerInput.value = !showStickerInput.value
}

const toggleReplyInput = (commentId) => {
  showReplyInputByCommentId.value = {
    ...showReplyInputByCommentId.value,
    [commentId]: !showReplyInputByCommentId.value[commentId],
  }
}

const toggleReplyStickerInput = (commentId) => {
  showReplyStickerInputByCommentId.value = {
    ...showReplyStickerInputByCommentId.value,
    [commentId]: !showReplyStickerInputByCommentId.value[commentId],
  }
}

const repliesFor = (commentId) => commentStore.repliesByCommentId[commentId] || []

const hasReplies = (comment) => {
  return (comment.replyCount || 0) > 0 || repliesFor(comment._id).length > 0
}

const isRepliesExpanded = (commentId) => Boolean(expandedRepliesByCommentId.value[commentId])

const toggleReplies = async (comment) => {
  const commentId = comment._id
  const expanded = isRepliesExpanded(commentId)

  if (expanded) {
    expandedRepliesByCommentId.value = {
      ...expandedRepliesByCommentId.value,
      [commentId]: false,
    }
    return
  }

  if (!commentStore.repliesByCommentId[commentId]) {
    try {
      await commentStore.fetchReplies(commentId)
    } catch (_error) {
      return
    }
  }

  expandedRepliesByCommentId.value = {
    ...expandedRepliesByCommentId.value,
    [commentId]: true,
  }
}

const handleReplySubmit = async (commentId) => {
  const normalizedContent = (replyContentByCommentId.value[commentId] || '').trim()
  const normalizedStickerUrl = (replyStickerUrlByCommentId.value[commentId] || '').trim()
  if (!normalizedContent && !normalizedStickerUrl) return
  if (submittingReplyByCommentId.value[commentId]) return

  submittingReplyByCommentId.value = {
    ...submittingReplyByCommentId.value,
    [commentId]: true,
  }

  try {
    await commentStore.addComment(props.artworkId, {
      parentCommentId: commentId,
      content: normalizedContent,
      stickerUrl: normalizedStickerUrl,
    })

    replyContentByCommentId.value = {
      ...replyContentByCommentId.value,
      [commentId]: '',
    }
    replyStickerUrlByCommentId.value = {
      ...replyStickerUrlByCommentId.value,
      [commentId]: '',
    }
    showReplyStickerInputByCommentId.value = {
      ...showReplyStickerInputByCommentId.value,
      [commentId]: false,
    }
    expandedRepliesByCommentId.value = {
      ...expandedRepliesByCommentId.value,
      [commentId]: true,
    }
  } catch (_error) {
  } finally {
    submittingReplyByCommentId.value = {
      ...submittingReplyByCommentId.value,
      [commentId]: false,
    }
  }
}

const handleDelete = async (commentId) => {
  try {
    await commentStore.removeComment(commentId)
  } catch (_error) {
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
        <button class="emoji-btn" aria-label="Toggle sticker URL" title="Toggle sticker URL" @click="toggleStickerInput">
          <i class="far fa-image" aria-hidden="true"></i>
        </button>
      </div>
      <button 
        class="send-btn" 
        :disabled="(!commentContent.trim() && !stickerUrl.trim()) || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '...' : 'Send' }}
      </button>
    </div>

    <div v-if="showStickerInput" class="sticker-url-row mb-4">
      <input
        v-model="stickerUrl"
        class="form-control form-control-sm"
        type="url"
        placeholder="Sticker image URL (optional)"
      />
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
              <p v-if="comment.content" class="comment-text mt-1 mb-2">{{ comment.content }}</p>
              <img
                v-if="comment.stickerUrl"
                :src="comment.stickerUrl"
                alt="Comment sticker"
                class="comment-sticker mt-1 mb-2"
              />
              <div class="comment-meta d-flex align-items-center gap-3">
                <span class="comment-date text-muted">{{ formatDate(comment.createdAt) }}</span>
                <button class="btn-reply p-0 border-0 bg-transparent" @click="toggleReplyInput(comment._id)">
                  Reply
                </button>
              </div>
            </div>
            <button
              v-if="canDeleteComment(comment)"
              class="btn-delete p-0 border-0 bg-transparent"
              @click="handleDelete(comment._id)"
            >
              Delete
            </button>
          </div>

          <div v-if="showReplyInputByCommentId[comment._id]" class="reply-input-block mt-3">
            <textarea
              v-model="replyContentByCommentId[comment._id]"
              class="comment-textarea"
              placeholder="Write a reply"
              rows="1"
            ></textarea>
            <div class="d-flex align-items-center gap-2 mt-2">
              <button
                class="btn-reply-action"
                aria-label="Toggle reply sticker URL"
                title="Toggle reply sticker URL"
                @click="toggleReplyStickerInput(comment._id)"
              >
                <i class="far fa-image" aria-hidden="true"></i>
              </button>
              <button
                class="btn-reply-action btn-reply-send"
                :disabled="(!(replyContentByCommentId[comment._id] || '').trim() && !(replyStickerUrlByCommentId[comment._id] || '').trim()) || submittingReplyByCommentId[comment._id]"
                @click="handleReplySubmit(comment._id)"
              >
                {{ submittingReplyByCommentId[comment._id] ? '...' : 'Send Reply' }}
              </button>
            </div>

            <input
              v-if="showReplyStickerInputByCommentId[comment._id]"
              v-model="replyStickerUrlByCommentId[comment._id]"
              class="form-control form-control-sm mt-2"
              type="url"
              placeholder="Sticker image URL (optional)"
            />
          </div>

          <div v-if="hasReplies(comment)" class="mt-2 text-start">
            <button class="btn-display-replies py-1 px-3" @click="toggleReplies(comment)">
              {{ isRepliesExpanded(comment._id) ? 'Hide Replies' : `Display Replies (${comment.replyCount || repliesFor(comment._id).length})` }}
            </button>
          </div>

          <div v-if="isRepliesExpanded(comment._id)" class="replies-wrap mt-3 d-grid gap-3">
            <div v-if="commentStore.loadingRepliesByCommentId[comment._id]" class="text-muted small">Loading replies...</div>
            <template v-else>
              <div
                v-for="reply in repliesFor(comment._id)"
                :key="reply._id"
                class="reply-item d-flex gap-2"
              >
                <img :src="getAvatar(reply.user)" alt="Reply avatar" class="reply-avatar" />
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start gap-2">
                    <span class="user-name">{{ reply.user?.displayName || reply.user?.username }}</span>
                    <button
                      v-if="canDeleteComment(reply)"
                      class="btn-delete p-0 border-0 bg-transparent"
                      @click="handleDelete(reply._id)"
                    >
                      Delete
                    </button>
                  </div>
                  <p v-if="reply.content" class="comment-text mt-1 mb-2">{{ reply.content }}</p>
                  <img
                    v-if="reply.stickerUrl"
                    :src="reply.stickerUrl"
                    alt="Reply sticker"
                    class="comment-sticker mt-1 mb-2"
                  />
                  <span class="comment-date text-muted">{{ formatDate(reply.createdAt) }}</span>
                </div>
              </div>
              <div v-if="repliesFor(comment._id).length === 0" class="small text-muted">No replies yet.</div>
            </template>
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

.comment-sticker {
  max-width: 180px;
  max-height: 180px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e6e9ed;
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

.btn-delete {
  color: #b42318;
  font-size: 0.85rem;
  font-weight: 700;
}

.btn-delete:hover {
  text-decoration: underline;
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

.reply-input-block {
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 10px;
}

.btn-reply-action {
  border: 1px solid #d0d7de;
  background: #fff;
  border-radius: 14px;
  font-size: 0.8rem;
  padding: 4px 10px;
}

.btn-reply-send {
  font-weight: 700;
}

.btn-reply-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.replies-wrap {
  padding-left: 10px;
  border-left: 2px solid #eff1f3;
}

.reply-item {
  align-items: flex-start;
}

.reply-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f0f0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
