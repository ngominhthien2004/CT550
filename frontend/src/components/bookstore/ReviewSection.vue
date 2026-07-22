<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookStore } from '@/stores/book.store.js'
import { formatShortDate } from '@/utils/date.js'

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
const currentUserId = computed(() => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.id || payload._id
  } catch { return null }
})

const reviews = computed(() => bookStore.reviews)
const loading = computed(() => bookStore.reviewsLoading)
const submitLoading = computed(() => bookStore.reviewSubmitLoading)
const error = computed(() => bookStore.reviewsError)
const submitError = computed(() => bookStore.reviewSubmitError)
const pagination = computed(() => bookStore.reviewsPagination)
const userReview = computed(() => bookStore.userReview)

const hasUserReviewed = computed(() => !!userReview.value)

function setRating(val) {
  if (isEditing.value) return
  starRating.value = val
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
  if (!starRating.value) return
  
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
    // Reset form
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

function loadPage(page) {
  bookStore.fetchReviews(props.bookId, page)
}

onMounted(() => {
  bookStore.fetchReviews(props.bookId)
})
</script>

<template>
  <section class="review-section">
    <h2 class="review-heading">{{ t('bookstore.reviews') }}</h2>

    <!-- Review Form (only for authenticated users who haven't reviewed) -->
    <div v-if="!isAuthenticated" class="review-empty-state">
      <i class="fa-solid fa-lock"></i>
      <p>{{ t('bookstore.loginToReview') }}</p>
      <router-link to="/login" class="btn btn-primary btn-sm">
        {{ t('auth.loginButton') }}
      </router-link>
    </div>
    <div v-else-if="hasUserReviewed && !isEditing" class="review-already-reviewed alert alert-info">
      <i class="fa-solid fa-circle-check me-1"></i>
      {{ t('bookstore.alreadyReviewed') }}
    </div>
    <div v-else-if="!hasUserReviewed" class="review-form card">
      <div class="card-body">
        <h3 class="review-form-title">{{ t('bookstore.writeReview') }}</h3>
        
        <!-- Star Picker -->
        <div class="star-picker">
          <span class="star-label">{{ t('bookstore.yourRating') }}:</span>
          <span
            v-for="n in 5"
            :key="n"
            class="star"
            :class="{
              'filled': n <= (hoverRating || starRating),
              'hoverable': !isEditing
            }"
            @mouseenter="hoverRating = n"
            @mouseleave="hoverRating = 0"
            @click="setRating(n)"
          >★</span>
          <span v-if="starRating" class="star-value">({{ starRating }}/5)</span>
        </div>

        <textarea
          v-model="reviewText"
          class="form-control review-textarea"
          :placeholder="t('bookstore.writeReview') + '...'"
          rows="3"
          maxlength="2000"
        ></textarea>

        <p v-if="submitError" class="text-danger mt-2 small">{{ submitError }}</p>

        <button
          class="btn btn-primary mt-2"
          :disabled="!starRating || submitLoading"
          @click="handleSubmit"
        >
          <span v-if="submitLoading" class="spinner-border spinner-border-sm me-1"></span>
          {{ t('bookstore.submitReview') }}
        </button>
      </div>
    </div>

    <!-- User's own review (edit mode) -->
    <div v-if="isEditing" class="review-form card border-warning">
      <div class="card-body">
        <h3 class="review-form-title">{{ t('bookstore.updateReview') }}</h3>
        
        <div class="star-picker">
          <span class="star-label">{{ t('bookstore.yourRating') }}:</span>
          <span
            v-for="n in 5"
            :key="n"
            class="star filled"
            :class="{ 'hoverable': true }"
            @mouseenter="hoverRating = n"
            @mouseleave="hoverRating = 0"
            @click="starRating = n"
          >★</span>
          <span class="star-value">({{ starRating }}/5)</span>
        </div>

        <textarea
          v-model="reviewText"
          class="form-control review-textarea"
          rows="3"
          maxlength="2000"
        ></textarea>

        <p v-if="submitError" class="text-danger mt-2 small">{{ submitError }}</p>

        <div class="d-flex gap-2 mt-2">
          <button
            class="btn btn-primary"
            :disabled="!starRating || submitLoading"
            @click="handleSubmit"
          >
            <span v-if="submitLoading" class="spinner-border spinner-border-sm me-1"></span>
            {{ t('bookstore.updateReview') }}
          </button>
          <button class="btn btn-outline-secondary" @click="cancelEdit">
            {{ t('bookstore.cancelEdit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="reviews.length === 0" class="text-center py-4 text-muted">
      {{ t('bookstore.noReviews') }}
    </div>

    <div v-else class="reviews-list">
      <div
        v-for="review in reviews"
        :key="review._id"
        class="review-item card mb-3"
        :class="{ 'own-review': review.user?._id === currentUserId }"
      >
        <div class="card-body">
          <div v-if="review.user?._id === currentUserId" class="review-your-label">
            <i class="fa-solid fa-user-pen"></i>
            {{ t('bookstore.yourReview') }}
          </div>
          <div class="review-header">
            <div class="review-user">
              <img
                :src="review.user?.avatar || '/default-avatar.png'"
                :alt="review.user?.displayName"
                class="review-avatar"
              />
              <div>
                <strong>{{ review.user?.displayName || review.user?.username || 'Unknown' }}</strong>
                <span class="review-date">{{ formatShortDate(review.createdAt) }}</span>
              </div>
            </div>
            <div class="review-stars">
              <span v-for="n in 5" :key="n" class="star small" :class="{ filled: n <= review.rating }">★</span>
              <span class="star-text">{{ review.rating }}/5</span>
            </div>
          </div>

          <p v-if="review.content" class="review-content mt-2 mb-0">
            {{ review.content }}
          </p>

          <!-- Own review actions -->
          <div v-if="review.user?._id === currentUserId" class="review-actions mt-2">
            <button class="btn btn-sm btn-outline-primary me-1" @click="startEdit(review)">
              {{ t('bookstore.editReview') }}
            </button>
            <button
              class="btn btn-sm"
              :class="deleteConfirmId === review._id ? 'btn-danger' : 'btn-outline-danger'"
              @click="toggleDeleteConfirm(review._id)"
            >
              {{ deleteConfirmId === review._id ? t('bookstore.reviewDeleteConfirm') : t('bookstore.deleteReview') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="pagination.pages > 1" class="mt-3">
        <ul class="pagination justify-content-center pagination-sm">
          <li
            v-for="p in pagination.pages"
            :key="p"
            class="page-item"
            :class="{ active: p === pagination.page }"
          >
            <button class="page-link" @click="loadPage(p)">{{ p }}</button>
          </li>
        </ul>
      </nav>
    </div>
  </section>
</template>

<style scoped>
.review-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.review-heading {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--brand);
}

.review-form {
  margin-bottom: 1.5rem;
  background: var(--surface-alt);
  border: 1px solid var(--line);
}

.review-form-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.star-picker {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.star-label {
  font-size: 0.9rem;
  color: var(--muted);
  margin-right: 0.5rem;
}

.star {
  font-size: 1.5rem;
  color: var(--line);
  cursor: default;
  transition: color 0.15s, transform 0.15s;
  user-select: none;
}

.star.hoverable {
  cursor: pointer;
}

.star.hoverable:hover {
  transform: scale(1.2);
}

.star.filled {
  color: #f59e0b;
}

.star-value {
  font-size: 0.85rem;
  color: var(--muted);
  margin-left: 0.25rem;
}

.star.small {
  font-size: 1rem;
}

.star-text {
  font-size: 0.8rem;
  color: var(--muted);
  margin-left: 0.25rem;
}

.review-textarea {
  resize: vertical;
  min-height: 80px;
}

.reviews-list {
  /* container for review items */
}

.review-item {
  background: var(--surface);
  border: 1px solid var(--line);
}

.review-item.own-review {
  border-color: var(--brand);
  border-left: 3px solid var(--brand);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.review-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.review-date {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 400;
}

.review-stars {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  white-space: nowrap;
}

.review-content {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text);
  white-space: pre-line;
}

.review-actions {
  display: flex;
  gap: 0.35rem;
}

.review-empty-state {
  text-align: center;
  padding: 1.5rem;
  background: var(--surface-alt);
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
  color: var(--muted);
}

.review-empty-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
  color: var(--line);
}

.review-already-reviewed {
  margin-bottom: 1.5rem;
  border-color: var(--brand);
  background: var(--surface-alt);
  color: var(--text);
}

.review-your-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.review-your-label i {
  margin-right: 0.25rem;
}
</style>
