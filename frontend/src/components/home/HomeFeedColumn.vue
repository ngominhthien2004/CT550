<script setup>
import { computed, ref } from 'vue'
import R18BlurOverlay from '../common/R18BlurOverlay.vue'
import { formatShortDate } from '../../utils/date.js'

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  works: {
    type: Array,
    default: () => [],
  },
})

function formatDate(value) {
  return formatShortDate(value)
}

function visibleImages(work) {
  const images = Array.isArray(work?.images) ? work.images.filter(Boolean) : []
  return images.slice(0, 20)
}

function profileLink(userId) {
  return userId ? `/account?user=${userId}` : '/account'
}

function profileAvatar(work) {
  return work?.user?.avatar || DEFAULT_PROFILE_AVATAR
}

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}

// Pre-compute all display values for works to avoid method calls in template
const processedWorks = computed(() =>
  props.works.map(work => {
    const imgs = visibleImages(work)
    const count = imgs.length
    return {
      ...work,
      _profileLink: profileLink(work.user?._id),
      _profileAvatar: profileAvatar(work),
      _createdAt: formatDate(work.createdAt),
      _visibleImages: imgs,
      _hasMultipleImages: count > 1,
      _visibleImagesLength: count,
    }
  })
)

// Carousel state
const carouselRefs = ref({})
const currentPage = ref({})

function setCarouselRef(workId, el) {
  if (el) {
    carouselRefs.value[workId] = el
  }
}

function onCarouselScroll(workId, event) {
  const el = event.target
  const scrollLeft = el.scrollLeft
  const width = el.clientWidth
  const index = Math.round(scrollLeft / width)
  if (currentPage.value[workId] === index) return
  currentPage.value[workId] = index
}

function scrollCarousel(workId, direction) {
  const el = carouselRefs.value[workId]
  if (!el) return
  const width = el.clientWidth
  el.scrollBy({ left: direction * width, behavior: 'smooth' })
}
</script>

<template>
  <section class="feed-column">
    <header class="feed-head">
      <div>
        <h3>Recommended for you</h3>
      </div>
      <router-link to="/discovery">See more</router-link>
    </header>

    <p v-if="!works.length" class="empty-state">
      No recent works are available yet. Upload more content to build the home feed.
    </p>

    <div v-else class="feed-list">
      <article v-for="work in processedWorks" :key="work._id" class="feed-card">
        <header class="feed-card-head">
          <router-link :to="work._profileLink" class="author-link">
            <span class="author-avatar">
              <img
                :src="work._profileAvatar"
                :alt="work.user?.displayName || work.user?.username || work.title"
                @error="handleAvatarError"
              />
            </span>
            <span class="author-meta">
              <strong>{{ work.user?.displayName || work.user?.username || 'Unknown artist' }}</strong>
              <small>{{ work._createdAt }}</small>
            </span>
          </router-link>
          <button type="button" class="feed-more" aria-label="Artwork menu">
            <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
          </button>
        </header>

        <R18BlurOverlay :artwork="work" :showBadgeOnly="true">
          <div class="feed-carousel-wrapper">
            <div
              :ref="(el) => setCarouselRef(work._id, el)"
              class="feed-carousel"
              :class="{ 'is-single': !work._hasMultipleImages }"
              @scroll="onCarouselScroll(work._id, $event)"
            >
              <router-link
                v-for="image in work._visibleImages"
                :key="image"
                :to="`/artworks/${work._id}`"
                class="feed-carousel-item"
              >
                <img :src="image" :alt="work.title" loading="lazy" />
              </router-link>
            </div>

            <template v-if="work._hasMultipleImages">
              <button
                type="button"
                class="feed-arrow left"
                aria-label="Previous image"
                @click.prevent="scrollCarousel(work._id, -1)"
              >
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button
                type="button"
                class="feed-arrow right"
                aria-label="Next image"
                @click.prevent="scrollCarousel(work._id, 1)"
              >
                <i class="fa-solid fa-chevron-right"></i>
              </button>
              <span class="feed-page-badge" aria-hidden="true">
                {{ (currentPage[work._id] || 0) + 1 }}/{{ work._visibleImagesLength }}
              </span>
            </template>
          </div>
        </R18BlurOverlay>

        <div class="feed-card-body">
          <router-link :to="`/artworks/${work._id}`" class="feed-title">{{ work.title }}</router-link>
          <button type="button" class="heart-btn" aria-label="Like artwork">
            <i class="fa-regular fa-heart" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.feed-column {
  display: grid;
  gap: 1rem;
}

.feed-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.8rem;
}

.feed-head h3 {
  font-size: 1.6rem;
}

.feed-head p {
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 0.18rem;
}

.feed-head a {
  text-decoration: none;
  color: var(--accent);
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 18px;
  background: var(--surface);
  padding: 1rem;
  color: var(--muted);
}

.feed-list {
  display: grid;
  gap: 1rem;
}

.feed-card {
  display: grid;
  gap: 0.6rem;
}

.feed-card + .feed-card {
  position: relative;
}

.feed-card + .feed-card::before {
  content: '';
  position: absolute;
  top: -0.5rem;
  left: 0;
  right: 0;
  border-top: 1px solid #d9dce3;
}

.feed-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.author-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 0;
  color: inherit;
}

.author-avatar {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  overflow: hidden;
  background: var(--surface-alt);
  flex-shrink: 0;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.author-meta {
  display: grid;
  min-width: 0;
}

.author-meta strong,
.author-meta small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-meta strong {
  font-size: 0.94rem;
  color: var(--brand);
}

.author-meta small {
  color: var(--muted);
  font-size: 0.77rem;
}

.feed-more {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--muted);
}

.feed-carousel-wrapper {
  position: relative;
}

.feed-carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 4px;
  scrollbar-width: none;
  touch-action: pan-x;
}

.feed-carousel::-webkit-scrollbar {
  display: none;
}

.feed-carousel.is-single {
  scroll-snap-type: none;
}

.feed-carousel-item {
  flex: 0 0 100%;
  scroll-snap-align: start;
  text-decoration: none;
}

.feed-carousel-item img {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
  display: block;
  background: var(--surface-alt);
}

.feed-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;
}

.feed-carousel-wrapper:hover .feed-arrow {
  opacity: 1;
}

.feed-arrow.left {
  left: 0.75rem;
}

.feed-arrow.right {
  right: 0.75rem;
}

.feed-page-badge {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  min-width: 2rem;
  height: 1.7rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  pointer-events: none;
  z-index: 2;
}

.feed-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.feed-title {
  text-decoration: none;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.heart-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.heart-btn:hover {
  color: #e74c6f;
}

@media (max-width: 700px) {
  .feed-arrow {
    width: 2rem;
    height: 2rem;
  }
}
</style>
