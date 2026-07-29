<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookStore } from '@/stores/book.store.js'
import { formatShortDate, formatRelativeTime } from '@/utils/date.js'
import { getCurrentUserIdFromToken } from '@/utils/jwt.js'
import StarRating from '@/components/bookstore/StarRating.vue'

const props = defineProps({
  bookId: { type: String, required: true },
})

const { t } = useI18n()
const bookStore = useBookStore()

const reviewText = ref('')
const starRating = ref(0)
const hoverRating = ref(0)
const isEditing = ref(false)
const editReviewId = ref(null)
const deleteConfirmId = ref(null)

const isAuthenticated = computed(() => !!localStorage.getItem('token'))
const currentUserId = computed(() => getCurrentUserIdFromToken())

const reviews = computed(() => bookStore.reviews)
const loading = computed(() => bookStore.reviewsLoading)
const submitLoading = computed(() => bookStore.reviewSubmitLoading)
const error = computed(() => bookStore.reviewsError)
const submitError = computed(() => bookStore.reviewSubmitError)
const pagination = computed(() => bookStore.reviewsPagination)
const userReview = computed(() => bookStore.userReview)

const hasUserReviewed = computed(() => !!userReview.value)

const charCount = computed(() => reviewText.value.length)
const isOverLimit = computed(() => charCount.value > 2000)

function setRating(val) {
  if (isEditing.value) return
  starRating.value = val
}

function onStarKeydown(e, n) {
  let target = n
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    target = Math.min(5, n + 1)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    target = Math.max(1, n - 1)
  } else if (e.key === 'Home') {
    target = 1
  } else if (e.key === 'End') {
    target = 5
  } else {
    return
  }
  e.preventDefault()
  setRating(target)
  nextTick(() => {
    const el = document.querySelector(`.star-picker-group [aria-label="${target} ${target === 1 ? 'star' : 'stars'}"]`)
    if (el) el.focus()
  })
}

function startEdit(review) {
  isEditing.value = true
  editReviewId.value = review._id
  starRating.value = review.rating
  reviewText.value = review.content
}

function cancelEdit() {
  isEditing.value = false
  editReviewId.value = null
  starRating.value = 0
  reviewText.value = ''
}

async function handleSubmit() {
  if (!starRating.value || isOverLimit.value) return

  if (isEditing.value && editReviewId.value) {
    await bookStore.updateUserReview(editReviewId.value, {
      rating: starRating.value,
      content: reviewText.value,
    })
    cancelEdit()
  } else {
    await bookStore.submitReview(props.bookId, {
      rating: starRating.value,
      content: reviewText.value,
    })
    starRating.value = 0
    reviewText.value = ''
  }
}

async function handleDelete(reviewId) {
  await bookStore.removeReview(reviewId)
  deleteConfirmId.value = null
}

function toggleDeleteConfirm(reviewId) {
  if (deleteConfirmId.value === reviewId) {
    handleDelete(reviewId)
  } else {
    deleteConfirmId.value = reviewId
  }
}

function cancelDeleteConfirm() {
  deleteConfirmId.value = null
}

function loadPage(page) {
  bookStore.fetchReviews(props.bookId, page)
}

function onDocumentClick(e) {
  if (!deleteConfirmId.value) return
  const actions = e.target.closest('.review-actions')
  if (actions && actions.querySelector('.btn-danger')) return
  deleteConfirmId.value = null
}

function getStarLabel(n) {
  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
  return labels[n - 1] || ''
}

onMounted(() => {
  bookStore.fetchReviews(props.bookId)
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <section class="review-section">
    <h2 class="review-heading">
      <i class="fa-solid fa-comments"></i>
      {{ t('bookstore.reviews') }}
      <span v-if="pagination.total" class="review-count-badge">{{ pagination.total }}</span>
    </h2>

    <!-- Login prompt -->
    <div v-if="!isAuthenticated" class="review-login-prompt">
      <div class="review-login-icon">
        <i class="fa-solid fa-lock"></i>
      </div>
      <p class="review-login-text">{{ t('bookstore.loginToReview') }}</p>
      <router-link to="/login" class="btn btn-primary btn-sm">
        <i class="fa-solid fa-right-to-bracket me-1"></i>
        {{ t('auth.loginButton') }}
      </router-link>
    </div>

    <!-- Already reviewed notice -->
    <div v-else-if="hasUserReviewed && !isEditing" class="review-already-reviewed">
      <i class="fa-solid fa-circle-check"></i>
      <span>{{ t('bookstore.alreadyReviewed') }}</span>
    </div>

    <!-- New Review Form -->
    <div v-else-if="!hasUserReviewed" class="review-form-wrapper">
      <div class="review-form">
        <div class="review-form-header">
          <h3 class="review-form-title">{{ t('bookstore.writeReview') }}</h3>
        </div>

        <!-- Star Picker -->
        <div class="star-picker">
          <div
            class="star-picker-group"
            role="radiogroup"
            :aria-label="t('bookstore.yourRating')"
            @mouseleave="hoverRating = 0"
          >
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="star-pick-btn"
              :class="{
                'star-pick-btn--active': n <= (hoverRating || starRating),
                'star-pick-btn--hover': hoverRating > 0 && n <= hoverRating,
              }"
              :aria-label="`${n} ${n === 1 ? 'star' : 'stars'} — ${getStarLabel(n)}`"
              :aria-checked="n === starRating"
              :aria-pressed="n === starRating"
              :disabled="isEditing"
              :tabindex="isEditing ? -1 : (n === 1 ? 0 : -1)"
              @mouseenter="hoverRating = n"
              @focus="hoverRating = n"
              @blur="hoverRating = 0"
              @click="setRating(n)"
              @keydown="onStarKeydown($event, n)"
            >★</button>
          </div>
          <transition name="fade">
            <span v-if="starRating" class="star-pick-label">
              {{ getStarLabel(starRating) }}
              <span class="star-pick-value">({{ starRating }}/5)</span>
            </span>
          </transition>
        </div>

        <!-- Textarea with char count -->
        <div class="review-textarea-wrap">
          <textarea
            v-model="reviewText"
            class="review-textarea"
            :placeholder="t('bookstore.writeReview') + '...'"
            rows="3"
            maxlength="2000"
          ></textarea>
          <div class="review-textarea-footer">
            <span class="review-char-count" :class="{ 'review-char-count--over': isOverLimit }">
              {{ t('bookstore.charCount', { count: charCount }) }}
            </span>
          </div>
        </div>

        <p v-if="submitError" class="review-submit-error" role="alert">
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ submitError }}
        </p>

        <button
          class="review-submit-btn"
          :disabled="!starRating || submitLoading || isOverLimit"
          @click="handleSubmit"
        >
          <span v-if="submitLoading" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="fa-solid fa-paper-plane me-1"></i>
          {{ t('bookstore.submitReview') }}
        </button>
      </div>
    </div>

    <!-- Edit Review Form -->
    <div v-if="isEditing" class="review-form-wrapper">
      <div class="review-form review-form--edit">
        <div class="review-form-header">
          <h3 class="review-form-title">{{ t('bookstore.updateReview') }}</h3>
        </div>

        <div class="star-picker">
          <div
            class="star-picker-group"
            role="radiogroup"
            :aria-label="t('bookstore.yourRating')"
            @mouseleave="hoverRating = 0"
          >
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="star-pick-btn star-pick-btn--active"
              :aria-label="`${n} ${n === 1 ? 'star' : 'stars'} — ${getStarLabel(n)}`"
              :aria-checked="n === starRating"
              :aria-pressed="n === starRating"
              :tabindex="n === 1 ? 0 : -1"
              @mouseenter="hoverRating = n"
              @focus="hoverRating = n"
              @blur="hoverRating = 0"
              @click="starRating = n"
              @keydown="onStarKeydown($event, n)"
            >★</button>
          </div>
          <span class="star-pick-label">
            {{ getStarLabel(starRating) }}
            <span class="star-pick-value">({{ starRating }}/5)</span>
          </span>
        </div>

        <div class="review-textarea-wrap">
          <textarea
            v-model="reviewText"
            class="review-textarea"
            rows="3"
            maxlength="2000"
          ></textarea>
          <div class="review-textarea-footer">
            <span class="review-char-count" :class="{ 'review-char-count--over': isOverLimit }">
              {{ t('bookstore.charCount', { count: charCount }) }}
            </span>
          </div>
        </div>

        <p v-if="submitError" class="review-submit-error" role="alert">
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ submitError }}
        </p>

        <div class="review-edit-actions">
          <button
            class="review-submit-btn"
            :disabled="!starRating || submitLoading || isOverLimit"
            @click="handleSubmit"
          >
            <span v-if="submitLoading" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="fa-solid fa-check me-1"></i>
            {{ t('bookstore.updateReview') }}
          </button>
          <button class="review-cancel-btn" @click="cancelEdit">
            {{ t('bookstore.cancelEdit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="reviews-loading">
      <div v-for="n in 3" :key="n" class="review-skeleton">
        <div class="review-skeleton-header">
          <div class="review-skeleton-avatar"></div>
          <div class="review-skeleton-meta">
            <div class="review-skeleton-name"></div>
            <div class="review-skeleton-date"></div>
          </div>
          <div class="review-skeleton-stars"></div>
        </div>
        <div class="review-skeleton-content">
          <div class="review-skeleton-line"></div>
          <div class="review-skeleton-line review-skeleton-line--short"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="review-error">
      <i class="fa-solid fa-triangle-exclamation"></i>
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="review-empty">
      <div class="review-empty-icon">
        <i class="fa-regular fa-comment-dots"></i>
      </div>
      <p class="review-empty-title">{{ t('bookstore.noReviewsYet') }}</p>
      <p class="review-empty-subtitle">{{ t('bookstore.beFirstToReview') }}</p>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-list">
      <div
        v-for="review in reviews"
        :key="review._id"
        class="review-card"
        :class="{ 'review-card--own': review.user?._id === currentUserId }"
      >
        <div v-if="review.user?._id === currentUserId" class="review-own-badge">
          <i class="fa-solid fa-user-pen"></i>
          {{ t('bookstore.yourReview') }}
        </div>

        <div class="review-card-header">
          <div class="review-user-info">
            <img
              :src="review.user?.avatar || '/default-avatar.png'"
              :alt="review.user?.displayName"
              class="review-avatar"
            />
            <div class="review-user-meta">
              <strong class="review-username">{{ review.user?.displayName || review.user?.username || t('bookstore.unknownUser') }}</strong>
              <span class="review-date">{{ formatRelativeTime(review.createdAt) }}</span>
            </div>
          </div>
          <div class="review-rating-display">
            <StarRating :value="review.rating" :max="5" size="small" />
            <span class="review-rating-text">{{ review.rating }}/{{ 5 }}</span>
          </div>
        </div>

        <p v-if="review.content" class="review-card-content">
          {{ review.content }}
        </p>

        <!-- Own review actions -->
        <div v-if="review.user?._id === currentUserId" class="review-card-actions">
          <button class="review-action-btn review-action-btn--edit" @click="startEdit(review)">
            <i class="fa-solid fa-pen-to-square"></i>
            {{ t('bookstore.editReview') }}
          </button>
          <button
            class="review-action-btn"
            :class="deleteConfirmId === review._id ? 'review-action-btn--danger-active' : 'review-action-btn--danger'"
            @click="toggleDeleteConfirm(review._id)"
          >
            <i :class="deleteConfirmId === review._id ? 'fa-solid fa-triangle-exclamation' : 'fa-regular fa-trash-can'"></i>
            {{ deleteConfirmId === review._id ? t('bookstore.reviewDeleteConfirm') : t('bookstore.deleteReview') }}
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="pagination.pages > 1" class="reviews-pagination" :aria-label="t('bookstore.pagination')">
        <ul class="pagination justify-content-center pagination-sm">
          <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
            <button
              class="page-link"
              :disabled="pagination.page <= 1"
              :aria-label="t('bookstore.previous')"
              @click="loadPage(pagination.page - 1)"
            >
              &laquo;
            </button>
          </li>
          <li
            v-for="p in pagination.pages"
            :key="p"
            class="page-item"
            :class="{ active: p === pagination.page }"
          >
            <button
              class="page-link"
              :aria-current="p === pagination.page ? 'page' : undefined"
              :aria-label="t('bookstore.goToPage', { page: p })"
              @click="loadPage(p)"
            >{{ p }}</button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
            <button
              class="page-link"
              :disabled="pagination.page >= pagination.pages"
              :aria-label="t('bookstore.next')"
              @click="loadPage(pagination.page + 1)"
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </section>
</template>

<style scoped>
/* ── Section ── */
.review-section {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.review-heading {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: var(--brand);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-heading i {
  font-size: 1rem;
  opacity: 0.7;
}

.review-count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--surface-alt);
  color: var(--muted);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--line);
}

/* ── Login Prompt ── */
.review-login-prompt {
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--surface-alt);
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
}

.review-login-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--muted);
  font-size: 1.1rem;
}

.review-login-text {
  color: var(--muted);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

/* ── Already Reviewed ── */
.review-already-reviewed {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
  color: var(--text);
  font-size: 0.9rem;
}

.review-already-reviewed i {
  color: #10b981;
}

/* ── Form Wrapper ── */
.review-form-wrapper {
  margin-bottom: 1.5rem;
}

.review-form {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.25rem;
  transition: border-color 0.2s;
}

.review-form:focus-within {
  border-color: var(--brand);
}

.review-form--edit {
  border-color: #f59e0b;
  background: linear-gradient(to bottom, rgba(245, 158, 11, 0.03), var(--surface));
}

.review-form-header {
  margin-bottom: 0.75rem;
}

.review-form-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

/* ── Star Picker ── */
.star-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.star-picker-group {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.star-pick-btn {
  background: transparent;
  border: none;
  padding: 0.2rem;
  font-size: 1.6rem;
  color: var(--line);
  cursor: default;
  transition: color 0.12s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
  line-height: 1;
  border-radius: 4px;
}

.star-pick-btn:not(:disabled) {
  cursor: pointer;
}

.star-pick-btn:not(:disabled):hover,
.star-pick-btn:not(:disabled):focus-visible {
  transform: scale(1.25);
}

.star-pick-btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.star-pick-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-pick-btn--active {
  color: #f59e0b;
  filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.4));
}

.star-pick-btn--hover {
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.5));
}

.star-pick-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.star-pick-value {
  font-weight: 400;
  color: var(--muted);
  font-size: 0.8rem;
}

/* ── Textarea ── */
.review-textarea-wrap {
  margin-bottom: 0.75rem;
}

.review-textarea {
  width: 100%;
  resize: vertical;
  min-height: 80px;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.5;
  transition: border-color 0.15s;
  font-family: inherit;
}

.review-textarea:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(var(--brand-rgb, 99, 102, 241), 0.1);
}

.review-textarea::placeholder {
  color: var(--muted);
}

.review-textarea-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.35rem;
}

.review-char-count {
  font-size: 0.75rem;
  color: var(--muted);
  transition: color 0.15s;
}

.review-char-count--over {
  color: #ef4444;
  font-weight: 600;
}

/* ── Submit / Error ── */
.review-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1.1rem;
  background: var(--brand);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.review-submit-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--brand) 85%, #000);
}

.review-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-cancel-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.review-cancel-btn:hover {
  color: var(--text);
  border-color: var(--muted);
}

.review-submit-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #ef4444;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}

.review-edit-actions {
  display: flex;
  gap: 0.5rem;
}

/* ── Loading Skeleton ── */
.reviews-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-skeleton {
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.review-skeleton-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.review-skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-alt);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.review-skeleton-meta {
  flex: 1;
}

.review-skeleton-name {
  width: 120px;
  height: 14px;
  background: var(--surface-alt);
  border-radius: 4px;
  margin-bottom: 0.35rem;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.review-skeleton-date {
  width: 80px;
  height: 10px;
  background: var(--surface-alt);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.review-skeleton-stars {
  width: 90px;
  height: 14px;
  background: var(--surface-alt);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.review-skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.review-skeleton-line {
  height: 12px;
  background: var(--surface-alt);
  border-radius: 4px;
  width: 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.review-skeleton-line--short {
  width: 60%;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ── Error ── */
.review-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius);
  color: #ef4444;
  font-size: 0.9rem;
}

/* ── Empty State ── */
.review-empty {
  text-align: center;
  padding: 2.5rem 1.5rem;
  background: var(--surface-alt);
  border: 1px dashed var(--line);
  border-radius: var(--radius);
}

.review-empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 50%;
  font-size: 1.5rem;
  color: var(--line);
}

.review-empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.35rem;
}

.review-empty-subtitle {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
}

/* ── Review Cards ── */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-card {
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.review-card:hover {
  border-color: color-mix(in srgb, var(--line) 60%, var(--brand));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.review-card--own {
  border-left: 3px solid var(--brand);
}

.review-own-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.review-user-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.review-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--surface-alt);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.review-user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.review-username {
  font-size: 0.9rem;
  color: var(--text);
}

.review-date {
  font-size: 0.75rem;
  color: var(--muted);
}

.review-rating-display {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.review-rating-text {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 500;
}

.review-card-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-line;
  margin: 0 0 0.5rem;
}

/* ── Review Card Actions ── */
.review-card-actions {
  display: flex;
  gap: 0.4rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--line);
}

.review-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
}

.review-action-btn--edit {
  color: var(--brand);
  border-color: var(--line);
}

.review-action-btn--edit:hover {
  background: var(--surface-alt);
  border-color: var(--brand);
}

.review-action-btn--danger {
  color: #ef4444;
  border-color: var(--line);
}

.review-action-btn--danger:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
}

.review-action-btn--danger-active {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

/* ── Pagination ── */
.reviews-pagination {
  margin-top: 1rem;
}

/* ── Transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
