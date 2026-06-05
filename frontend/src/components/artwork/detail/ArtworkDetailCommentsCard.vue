<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useCommentStore } from '../../../stores/comment.store.js'
import { useAuthStore } from '../../../stores/auth.store.js'

const props = defineProps({
  artworkId: {
    type: String,
    required: true,
  },
  artworkOwnerId: {
    type: String,
    default: '',
  },
})

const commentStore = useCommentStore()
const authStore = useAuthStore()
const commentContent = ref('')
const stickerUrl = ref('')
const showStickerInput = ref(false)
const stickerPresets = ['❤️', '😊', '👍', '🔥', '🎉', '💛', '💜', '✨', '💪', '🙌', '🌈', '⭐']
const isSubmitting = ref(false)
const expandedRepliesByCommentId = ref({})
const showReplyInputByCommentId = ref({})
const replyContentByCommentId = ref({})
const replyStickerUrlByCommentId = ref({})
const showReplyStickerInputByCommentId = ref({})
const submittingReplyByCommentId = ref({})

const confirmDeleteId = ref(null)
const textareaRef = ref(null)

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
  return authStore.user?.avatar || 'https://s.pximg.net/common/images/no_profile.png'
})

const currentUserId = computed(() => authStore.user?._id || '')
const isAdmin = computed(() => authStore.user?.role === 'admin')

const canDeleteComment = (comment) => {
  if (!currentUserId.value) return false
  return isAdmin.value 
    || comment?.user?._id === currentUserId.value 
    || props.artworkOwnerId === currentUserId.value
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
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  } catch (_error) {
  } finally {
    isSubmitting.value = false
  }
}

const toggleStickerInput = () => {
  showStickerInput.value = !showStickerInput.value
}

function selectSticker(url) {
  stickerUrl.value = url
  showStickerInput.value = false
  handleSubmit()
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
  if (confirmDeleteId.value !== commentId) {
    confirmDeleteId.value = commentId
    return
  }

  confirmDeleteId.value = null
  try {
    await commentStore.removeComment(commentId)
  } catch (_error) {
  }
}

function autoResize() {
  nextTick(() => {
    const el = textareaRef.value
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  })
}

function onClickOutsideDelete(event) {
  if (confirmDeleteId.value) {
    if (!event.target.closest('.btn-delete')) {
      confirmDeleteId.value = null
    }
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutsideDelete)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutsideDelete)
})

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
  return 'https://s.pximg.net/common/images/no_profile.png'
}
</script>

<template>
  <div class="comments-section mt-5">
    <h3 class="section-title mb-4">Comments</h3>

    <!-- Input Area -->
    <div class="comment-input-row d-flex gap-3 mb-5">
      <img :src="currentUserAvatar" alt="User" class="avatar avatar--sm" />
      <div class="input-wrapper flex-grow-1 position-relative">
        <textarea
          v-model="commentContent"
          ref="textareaRef"
          class="comment-textarea"
          placeholder="Leave a comment"
          rows="1"
          @keydown.enter.ctrl="handleSubmit"
          @input="autoResize"
        ></textarea>
        <button class="emoji-btn" aria-label="Toggle sticker picker" title="Toggle sticker picker" @click="toggleStickerInput">
          <i class="far fa-laugh" aria-hidden="true"></i>
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

    <div v-if="showStickerInput" class="sticker-picker-row mb-4">
      <div class="sticker-grid">
        <button
          v-for="(sticker, i) in stickerPresets"
          :key="i"
          class="sticker-option"
          @click="selectSticker(sticker)"
        >
          <span class="sticker-emoji">{{ sticker }}</span>
        </button>
      </div>
    </div>

    <!-- Comment List -->
    <div v-if="commentStore.loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-muted"></div>
    </div>

    <div v-else class="comment-list d-grid gap-4">
      <div v-for="comment in commentStore.items" :key="comment._id" class="comment-item d-flex gap-3">
        <img :src="getAvatar(comment.user)" alt="Avatar" class="avatar avatar--sm" />
        <div class="comment-content flex-grow-1">
          <div>
            <div class="author-info">
              <span class="user-name">{{ comment.user?.displayName || comment.user?.username }}</span>
              <p v-if="comment.content" class="comment-text comment-content mt-1 mb-2">{{ comment.content }}</p>
              <span v-if="comment.stickerUrl" class="comment-sticker comment-content sticker-display mt-1 mb-2">{{ comment.stickerUrl }}</span>
              <div class="comment-meta d-flex align-items-center gap-3">
                <span class="comment-date text-muted">{{ formatDate(comment.createdAt) }}</span>
                <button class="btn-reply p-0 border-0 bg-transparent" @click="toggleReplyInput(comment._id)">
                  Reply
                </button>
                <button
                  v-if="canDeleteComment(comment)"
                  class="btn-delete p-0 border-0 bg-transparent"
                  :class="{ 'confirming': confirmDeleteId === comment._id }"
                  @click="handleDelete(comment._id)"
                >
                  {{ confirmDeleteId === comment._id ? 'Confirm?' : 'Delete' }}
                </button>
              </div>
            </div>
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
                <img :src="getAvatar(reply.user)" alt="Reply avatar" class="avatar avatar--xs" />
                <div class="flex-grow-1">
                  <div class="author-info">
                    <span class="user-name">{{ reply.user?.displayName || reply.user?.username }}</span>
                    <p v-if="reply.content" class="comment-text comment-content mt-1 mb-2">{{ reply.content }}</p>
                    <span v-if="reply.stickerUrl" class="comment-sticker comment-content sticker-display mt-1 mb-2">{{ reply.stickerUrl }}</span>
                    <div class="comment-meta d-flex align-items-center gap-3">
                      <span class="comment-date text-muted">{{ formatDate(reply.createdAt) }}</span>
                      <button
                        v-if="canDeleteComment(reply)"
                        class="btn-delete p-0 border-0 bg-transparent"
                        :class="{ 'confirming': confirmDeleteId === reply._id }"
                        @click="handleDelete(reply._id)"
                      >
                        {{ confirmDeleteId === reply._id ? 'Confirm?' : 'Delete' }}
                      </button>
                    </div>
                  </div>
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
  color: var(--brand);
}

.comment-input-row {
  align-items: center;
}

.input-wrapper {
  background-color: var(--surface-alt);
  border-radius: 8px;
  padding: 10px 12px;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.input-wrapper:focus-within {
  background-color: var(--surface-alt);
}

.comment-textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  resize: none;
  padding-right: 48px;
  line-height: 1.4;
}

.emoji-btn {
  position: absolute;
  right: 12px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.send-btn {
  background-color: var(--accent);
  color: var(--surface);
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
  background-color: var(--accent-hover);
}

.send-btn:disabled {
  background-color: var(--accent);
  opacity: 0.5;
  cursor: not-allowed;
}

/* Comment Item Styles */
.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--brand);
  display: block;
}

.comment-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  margin: 0;
}

.comment-content {
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

.comment-meta {
  font-size: 0.85rem;
}

.comment-sticker.sticker-display {
  font-size: 3rem;
  line-height: 1.2;
  display: inline-block;
}

.comment-date {
  color: var(--muted);
}

.btn-reply {
  color: var(--accent);
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
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 700;
}

.btn-delete:hover {
  text-decoration: underline;
}

.btn-delete.confirming {
  color: #ff4444;
  font-weight: 800;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn-display-replies {
  border: none;
  background-color: var(--surface-alt);
  color: var(--brand);
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-display-replies:hover {
  background-color: var(--line);
}

.comment-item {
  min-width: 0;
  animation: fadeIn 0.3s ease-out;
}

.reply-input-block {
  background-color: var(--surface-alt);
  border-radius: 8px;
  padding: 10px;
}

.btn-reply-action {
  border: 1px solid var(--line);
  background: var(--surface);
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
  border-left: 2px solid var(--line);
}

.reply-item {
  align-items: flex-start;
}

.sticker-picker {
  margin-bottom: 1rem;
}

.sticker-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sticker-emoji {
  font-size: 1.8rem;
  line-height: 1;
}

.sticker-option {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  border: 2px solid transparent;
  padding: 4px;
  cursor: pointer;
  background: var(--surface-alt);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticker-option:hover {
  border-color: var(--accent);
  background: var(--surface);
  transform: scale(1.1);
}

.sticker-option.active {
  border-color: var(--accent);
  background: var(--accent);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
