<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useCommentStore } from '../../../stores/comment.store.js'
import { useAuthStore } from '../../../stores/auth.store.js'
import ReportModal from '@/components/common/ReportModal.vue'
import { formatShortDate } from '../../../utils/date.js'

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
const emoji = ref('')
const showStickerInput = ref(false)
const reportModalComment = ref(null)
const showReportModal = ref(false)
const stickerPresets = ['❤️', '😊', '👍', '🔥', '🎉', '💛', '💜', '✨', '💪', '🙌', '🌈', '⭐']
const showReplyStickerPickerByCommentId = ref({})
const isSubmitting = ref(false)
const expandedRepliesByCommentId = ref({})
const showReplyInputByCommentId = ref({})
const replyContentByCommentId = ref({})
const replyEmojiByCommentId = ref({})
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
}

const canReportComment = (comment) => {
  if (!currentUserId.value) return false
  if (isAdmin.value) return false
  return comment?.user?._id !== currentUserId.value
}

function openReportModal(comment) {
  reportModalComment.value = comment
  showReportModal.value = true
}

function closeReportModal() {
  showReportModal.value = false
  reportModalComment.value = null
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  const normalizedContent = commentContent.value.trim()
  const normalizedEmoji = emoji.value.trim()
  if (!normalizedContent && !normalizedEmoji) return

  isSubmitting.value = true
  try {
    await commentStore.addComment(props.artworkId, {
      content: normalizedContent,
      emoji: normalizedEmoji,
    })
    commentContent.value = ''
    emoji.value = ''
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
  emoji.value = url
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

const toggleReplyStickerPicker = (commentId) => {
  showReplyStickerPickerByCommentId.value = {
    ...showReplyStickerPickerByCommentId.value,
    [commentId]: !showReplyStickerPickerByCommentId.value[commentId],
  }
}

function selectReplySticker(commentId, sticker) {
  replyEmojiByCommentId.value = {
    ...replyEmojiByCommentId.value,
    [commentId]: sticker,
  }
  showReplyStickerPickerByCommentId.value = {
    ...showReplyStickerPickerByCommentId.value,
    [commentId]: false,
  }
  handleReplySubmit(commentId)
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
  const normalizedEmoji = (replyEmojiByCommentId.value[commentId] || '').trim()
  if (!normalizedContent && !normalizedEmoji) return
  if (submittingReplyByCommentId.value[commentId]) return

  submittingReplyByCommentId.value = {
    ...submittingReplyByCommentId.value,
    [commentId]: true,
  }

  try {
    await commentStore.addComment(props.artworkId, {
      parentCommentId: commentId,
      content: normalizedContent,
      emoji: normalizedEmoji,
    })

    replyContentByCommentId.value = {
      ...replyContentByCommentId.value,
      [commentId]: '',
    }
    replyEmojiByCommentId.value = {
      ...replyEmojiByCommentId.value,
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

const processedComments = computed(() =>
  commentStore.items.map(comment => {
    const replyList = repliesFor(comment._id)
    return {
      ...comment,
      _avatar: getAvatar(comment.user),
      _createdAt: formatDate(comment.createdAt),
      _canDelete: canDeleteComment(comment),
      _canReport: canReportComment(comment),
      _hasReplies: hasReplies(comment),
      _isExpanded: isRepliesExpanded(comment._id),
      _replyCount: comment.replyCount || replyList.length,
      _replyCountDisplay: comment.replyCount || replyList.length,
      _replies: replyList.map(reply => ({
        ...reply,
        _avatar: getAvatar(reply.user),
        _createdAt: formatDate(reply.createdAt),
        _canDelete: canDeleteComment(reply),
      })),
    }
  })
)

onMounted(() => {
  document.addEventListener('click', onClickOutsideDelete)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutsideDelete)
})

const formatDate = (dateString) => {
  return formatShortDate(dateString)
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
    <h3 class="section-title mb-4">{{ $t('artwork.comments') }}</h3>

    <!-- Input Area -->
    <div class="comment-input-row d-flex gap-3 mb-5">
      <img :src="currentUserAvatar" alt="User" class="avatar avatar--sm" />
      <div class="input-wrapper flex-grow-1 position-relative">
        <textarea
          v-model="commentContent"
          ref="textareaRef"
          class="comment-textarea"
          :placeholder="$t('artwork.leaveComment')"
          rows="1"
          aria-label="Write a comment"
          @keydown.enter.ctrl="handleSubmit"
          @input="autoResize"
        ></textarea>
        <button type="button" class="emoji-btn"     aria-label="Toggle emoji picker" title="Toggle emoji picker" @click="toggleStickerInput">
          <i class="far fa-laugh" aria-hidden="true"></i>
        </button>
      </div>
      <button type="button" 
        class="send-btn" 
        :disabled="(!commentContent.trim() && !emoji.trim()) || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '...' : $t('artwork.send') }}
      </button>
    </div>

    <div v-if="showStickerInput" class="sticker-picker-row mb-4">
      <div class="sticker-grid">
        <button type="button"
          v-for="sticker in stickerPresets"
          :key="sticker"
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
      <div v-for="comment in processedComments" :key="comment._id" class="comment-item d-flex gap-3">
        <img :src="comment._avatar" alt="Avatar" class="avatar avatar--sm" />
        <div class="comment-content flex-grow-1">
          <div>
            <div class="author-info">
              <span class="user-name">{{ comment.user?.displayName || comment.user?.username }}</span>
              <p v-if="comment.content" class="comment-text comment-content mt-1 mb-2">{{ comment.content }}</p>
              <span v-if="comment.emoji" class="comment-sticker comment-content sticker-display mt-1 mb-2">{{ comment.emoji }}</span>
              <div class="comment-meta d-flex align-items-center gap-3">
                <span class="comment-date text-muted">{{ comment._createdAt }}</span>
                <button type="button" class="btn-reply p-0 border-0 bg-transparent" @click="toggleReplyInput(comment._id)">
                  {{ $t('artwork.reply') }}
                </button>
                <button type="button"
                  v-if="comment._canDelete"
                  class="btn-delete p-0 border-0 bg-transparent"
                  :class="{ 'confirming': confirmDeleteId === comment._id }"
                  @click="handleDelete(comment._id)"
                >
                  {{ confirmDeleteId === comment._id ? $t('artwork.confirmDelete') : $t('artwork.delete') }}
                </button>
                <button type="button"
                  v-if="comment._canReport"
                  class="btn-report p-0 border-0 bg-transparent"
                  @click="openReportModal(comment)"
                >
                  <i class="fa-regular fa-flag me-1"></i>{{ $t('artwork.report') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="showReplyInputByCommentId[comment._id]" class="reply-input-block mt-3">
            <textarea
              v-model="replyContentByCommentId[comment._id]"
              class="comment-textarea"
              :placeholder="$t('artwork.writeReply')"
              rows="1"
              aria-label="Write a reply"
            ></textarea>
            <div class="d-flex align-items-center gap-2 mt-2">
              <button type="button"
                class="btn-reply-action"
                aria-label="Toggle reply sticker"
                title="Toggle reply sticker"
                @click="toggleReplyStickerPicker(comment._id)"
              >
                <i class="far fa-laugh" aria-hidden="true"></i>
              </button>
              <button type="button"
                class="btn-reply-action btn-reply-send"
                :disabled="(!(replyContentByCommentId[comment._id] || '').trim() && !(replyEmojiByCommentId[comment._id] || '').trim()) || submittingReplyByCommentId[comment._id]"
                @click="handleReplySubmit(comment._id)"
              >
                {{ submittingReplyByCommentId[comment._id] ? '...' : $t('artwork.sendReply') }}
              </button>
            </div>

            <div v-if="showReplyStickerPickerByCommentId[comment._id]" class="sticker-grid mt-2">
              <button type="button"
                v-for="sticker in stickerPresets"
                :key="sticker"
                class="sticker-option"
                @click="selectReplySticker(comment._id, sticker)"
              >
                <span class="sticker-emoji">{{ sticker }}</span>
              </button>
            </div>
          </div>

          <div v-if="comment._hasReplies" class="mt-2 text-start">
            <button type="button" class="btn-display-replies py-1 px-3" @click="toggleReplies(comment)">
              {{ comment._isExpanded ? $t('artwork.hideReplies') : $t('artwork.displayReplies', { count: comment._replyCountDisplay }) }}
            </button>
          </div>

          <div v-if="comment._isExpanded" class="replies-wrap mt-3 d-grid gap-3">
            <div v-if="commentStore.loadingRepliesByCommentId[comment._id]" class="text-muted small">{{ $t('artwork.loadingReplies') }}</div>
            <template v-else>
              <div
                v-for="reply in comment._replies"
                :key="reply._id"
                class="reply-item d-flex gap-2"
              >
                <img :src="reply._avatar" alt="Reply avatar" class="avatar avatar--xs" />
                <div class="flex-grow-1">
                  <div class="author-info">
                    <span class="user-name">{{ reply.user?.displayName || reply.user?.username }}</span>
                    <p v-if="reply.content" class="comment-text comment-content mt-1 mb-2">{{ reply.content }}</p>
                    <span v-if="reply.emoji" class="comment-sticker comment-content sticker-display mt-1 mb-2">{{ reply.emoji }}</span>
                    <div class="comment-meta d-flex align-items-center gap-3">
                      <span class="comment-date text-muted">{{ reply._createdAt }}</span>
                      <button type="button"
                        v-if="reply._canDelete"
                        class="btn-delete p-0 border-0 bg-transparent"
                        :class="{ 'confirming': confirmDeleteId === reply._id }"
                        @click="handleDelete(reply._id)"
                      >
                        {{ confirmDeleteId === reply._id ? $t('artwork.confirmDelete') : $t('artwork.delete') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="comment._replies.length === 0" class="small text-muted">{{ $t('artwork.noReplies') }}</div>
            </template>
          </div>
        </div>
      </div>
      
      <div v-if="commentStore.items.length === 0" class="text-center py-5 text-muted">
        {{ $t('artwork.noComments') }}
      </div>
    </div>

    <!-- Report Comment Modal -->
    <ReportModal
      :visible="showReportModal"
      report-type="comment"
      :target="reportModalComment"
      @close="closeReportModal"
      @reported="closeReportModal"
    />
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
  flex-wrap: wrap;
}

@media (max-width: 540px) {
  .comment-input-row {
    gap: 0.5rem !important;
  }

  .send-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
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
  color: #fff;
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

.btn-report {
  color: var(--muted, #6b7280);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-report:hover {
  color: var(--accent, #3b82f6);
  text-decoration: underline;
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
  background-color: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
}

.btn-reply-action {
  border: 1px solid var(--line);
  background: var(--surface-alt);
  color: var(--text);
  border-radius: 14px;
  font-size: 0.8rem;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-reply-action:hover {
  background: var(--line);
}

.btn-reply-send {
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.btn-reply-send:hover:not(:disabled) {
  background: var(--accent-hover);
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
