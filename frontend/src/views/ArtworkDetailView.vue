<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArtworkDetailCard, ArtworkDetailSidebar, ArtworkDetailCommentsCard, ArtworkDetailRelatedGrid } from '@/components/artwork'
import { NovelReader } from '@/components/novel'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import api, { getArtworks, getReadingProgress, saveReadingProgress, getSimilarArtworks, seriesApi } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useArtworkStore } from '../stores/artwork.store'
import { useBookmarkStore } from '../stores/bookmark.store'
import { useLikeStore } from '../stores/like.store'
import { useFollowStore } from '../stores/follow.store'
import { useI18n } from 'vue-i18n'
import { translateError } from '../utils/translateError.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const artworkStore = useArtworkStore()
const bookmarkStore = useBookmarkStore()
const likeStore = useLikeStore()
const followStore = useFollowStore()
const { t } = useI18n()
const isNavCollapsed = ref(true)
const relatedWorks = ref([])
const isBookmarked = ref(false)
const isLiked = ref(false)
const localBookmarkCount = ref(0)
const localLikeCount = ref(0)
const bookmarkError = ref('')
const likeError = ref('')
const followError = ref('')
const artistFollowersCount = ref(0)
const artistFollowingCount = ref(0)
const novelContent = ref('')
const readingProgress = ref(0)
const readingScrollPosition = ref(0)
const readingLastReadAt = ref('')
const seriesArtworkIds = ref([])
const seriesPrevId = ref(null)
const seriesNextId = ref(null)
const seriesInfo = ref(null)

const artworkId = computed(() => route.params.id)
const artwork = computed(() => artworkStore.detail)
const displayArtwork = computed(() => {
  if (!artwork.value) {
    return null
  }

  return {
    ...artwork.value,
    bookmarkCount: localBookmarkCount.value,
    likeCount: localLikeCount.value,
  }
})
const bookmarkLoading = computed(() => bookmarkStore.isTogglingBookmark(artworkId.value))
const likeLoading = computed(() => likeStore.isTogglingLike(artworkId.value))
const artistId = computed(() => artwork.value?.user?._id || '')
const isFollowing = computed(() => {
  if (!artistId.value) {
    return false
  }
  return followStore.isFollowingUser(artistId.value)
})
const followLoading = computed(() => {
  if (!artistId.value) {
    return false
  }
  return followStore.isTogglingFollow(artistId.value)
})
const displayAuthor = computed(() => {
  if (!artwork.value?.user) return t('artwork.unknownArtist')
  return artwork.value.user.displayName || artwork.value.user.username || t('artwork.unknownArtist')
})
const isOwnArtist = computed(() => {
  if (!artistId.value || !authStore.user?._id) {
    return false
  }
  return artistId.value === authStore.user._id
})

const hasSeriesNavigation = computed(() => {
  return seriesArtworkIds.value.length > 1
})

const sameAuthorWorks = computed(() => {
  if (!artistId.value) {
    return []
  }
  if (!Array.isArray(relatedWorks.value)) {
    return []
  }
  return relatedWorks.value
    .filter((item) => item?.user?._id === artistId.value)
    .slice(0, 6)
})

const artistAvatar = computed(() => {
  return artwork.value?.user?.avatar || 'https://s.pximg.net/common/images/no_profile.png'
})

function syncBookmarkCountFromArtwork() {
  localBookmarkCount.value = Number(artwork.value?.bookmarkCount || 0)
}

function syncLikeCountFromArtwork() {
  localLikeCount.value = Number(artwork.value?.likeCount || 0)
}

async function loadBookmarkStatus() {
  bookmarkError.value = ''

  if (!artworkId.value || !authStore.isAuthenticated) {
    isBookmarked.value = false
    return
  }

  try {
    const data = await bookmarkStore.fetchBookmarkStatus(artworkId.value)
    isBookmarked.value = Boolean(data?.isBookmarked)
  } catch (error) {
    isBookmarked.value = false
    bookmarkError.value = translateError(error, t, 'error.loadFailed')
  }
}

async function loadLikeStatus() {
  likeError.value = ''

  if (!artworkId.value || !authStore.isAuthenticated) {
    isLiked.value = false
    return
  }

  try {
    const data = await likeStore.fetchLikeStatus(artworkId.value)
    isLiked.value = Boolean(data?.isLiked)
  } catch (error) {
    isLiked.value = false
    likeError.value = translateError(error, t, 'error.loadFailed')
  }
}

async function loadFollowStatus() {
  followError.value = ''

  if (!artistId.value || !authStore.isAuthenticated || artistId.value === authStore.user?._id) {
    return
  }

  try {
    await followStore.fetchFollowStatus(artistId.value)
  } catch (error) {
    followError.value = translateError(error, t, 'error.loadFailed')
  }
}

async function loadFollowStats() {
  if (!artistId.value) {
    artistFollowersCount.value = 0
    artistFollowingCount.value = 0
    return
  }

  try {
    await Promise.all([
      followStore.fetchFollowers(artistId.value),
      followStore.fetchFollowing(artistId.value),
    ])
    artistFollowersCount.value = Number(followStore.followers.length || 0)
    artistFollowingCount.value = Number(followStore.following.length || 0)
  } catch (_error) {
    artistFollowersCount.value = 0
    artistFollowingCount.value = 0
  }
}

async function loadArtwork() {
  if (artworkId.value) {
    seriesPrevId.value = null
    seriesNextId.value = null
    seriesArtworkIds.value = []
    seriesInfo.value = null
    await artworkStore.fetchArtworkDetail(artworkId.value)
    syncBookmarkCountFromArtwork()
    syncLikeCountFromArtwork()
    await loadNovelData()
    await loadSeriesNavigation()
    await loadBookmarkStatus()
    await loadLikeStatus()
    await loadFollowStatus()
    await loadFollowStats()
    await loadRelatedWorks()
  }
}

async function loadRelatedWorks() {
  try {
    const { data } = await getSimilarArtworks(artworkId.value)
    if (!Array.isArray(data)) {
      relatedWorks.value = []
      return
    }

    relatedWorks.value = data
      .filter((item) => item?._id && item._id !== artworkId.value)
      .slice(0, 24)
  } catch (_error) {
    // Fallback: if CF endpoint fails, fetch recent artworks as before
    try {
      const { data: fallbackData } = await getArtworks()
      if (Array.isArray(fallbackData)) {
        relatedWorks.value = fallbackData
          .filter((item) => item?._id && item._id !== artworkId.value)
          .slice(0, 24)
      }
    } catch {
      relatedWorks.value = []
    }
  }
}

async function loadNovelData() {
  if (artwork.value?.type !== 'novel') return

  // Use artwork's novelContent directly (no separate Chapter model anymore)
  novelContent.value = artwork.value?.novelContent || artwork.value?.description || ''

  // Load reading progress (if authenticated)
  if (authStore.isAuthenticated) {
    try {
      const { data } = await getReadingProgress(artworkId.value)
      if (data?.progressPercent) {
        readingProgress.value = data.progressPercent
      }
      if (data?.scrollPosition) {
        readingScrollPosition.value = data.scrollPosition
      }
      if (data?.lastReadAt) {
        readingLastReadAt.value = data.lastReadAt
      }
    } catch (_err) {
      // Ignore - not critical
    }
  }
}

async function loadSeriesNavigation() {
  if (!artwork.value?.series) return
  try {
    const { data } = await seriesApi.getById(artwork.value.series)
    if (data?.artworks?.length > 1) {
      // artworks may be populated objects or plain IDs
      const ids = data.artworks.map(a => (typeof a === 'string' ? a : a._id))
      seriesArtworkIds.value = ids
      seriesInfo.value = data
      const idx = ids.indexOf(artwork.value._id)
      seriesPrevId.value = idx > 0 ? ids[idx - 1] : null
      seriesNextId.value = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null
    }
  } catch (_err) {
    seriesArtworkIds.value = []
  }
}

async function handleProgressChange({ progressPercent, scrollPosition }) {
  if (!authStore.isAuthenticated) return
  try {
    await saveReadingProgress(artworkId.value, {
      progressPercent,
      scrollPosition: scrollPosition || 0,
    })
  } catch (_err) {
    // Non-critical
  }
}

function handleScrollChange(scrollPos) {
  readingScrollPosition.value = scrollPos
}

async function handleLikeToggle() {
  likeError.value = ''

  if (!artworkId.value) {
    return
  }

  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  if (likeLoading.value) {
    return
  }

  const previousStatus = isLiked.value
  const previousCount = localLikeCount.value
  const nextStatus = !previousStatus
  const countDelta = nextStatus ? 1 : -1

  isLiked.value = nextStatus
  localLikeCount.value = Math.max(0, previousCount + countDelta)

  try {
    const data = await likeStore.toggleLikeByArtwork(artworkId.value)
    isLiked.value = Boolean(data?.isLiked)

    if (isLiked.value !== nextStatus) {
      localLikeCount.value = Math.max(0, previousCount + (isLiked.value ? 1 : -1))
    }
  } catch (error) {
    isLiked.value = previousStatus
    localLikeCount.value = previousCount
    likeError.value = translateError(error, t, 'error.saveFailed')
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function handleBookmarkToggle() {
  bookmarkError.value = ''

  if (!artworkId.value) {
    return
  }

  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  if (bookmarkLoading.value) {
    return
  }

  const previousStatus = isBookmarked.value
  const previousCount = localBookmarkCount.value
  const nextStatus = !previousStatus
  const countDelta = nextStatus ? 1 : -1

  isBookmarked.value = nextStatus
  localBookmarkCount.value = Math.max(0, previousCount + countDelta)

  try {
    const data = await bookmarkStore.toggleBookmarkByArtwork(artworkId.value)
    isBookmarked.value = Boolean(data?.isBookmarked)

    if (isBookmarked.value !== nextStatus) {
      localBookmarkCount.value = Math.max(0, previousCount + (isBookmarked.value ? 1 : -1))
    }
  } catch (error) {
    isBookmarked.value = previousStatus
    localBookmarkCount.value = previousCount
    bookmarkError.value = translateError(error, t, 'error.saveFailed')
  }
}

async function handleFollowToggle() {
  followError.value = ''

  if (!artistId.value || artistId.value === authStore.user?._id) {
    return
  }

  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  if (followLoading.value) {
    return
  }

  try {
    const wasFollowing = isFollowing.value
    await followStore.toggleFollowByUser(artistId.value)
    const nowFollowing = followStore.isFollowingUser(artistId.value)

    if (wasFollowing !== nowFollowing) {
      artistFollowersCount.value = Math.max(0, artistFollowersCount.value + (nowFollowing ? 1 : -1))
    }
  } catch (error) {
    followError.value = translateError(error, t, 'error.saveFailed')
  }
}

onMounted(loadArtwork)
watch(artworkId, loadArtwork)
watch(artwork, syncBookmarkCountFromArtwork)
watch(artwork, syncLikeCountFromArtwork)
watch(artistId, async () => {
  await loadFollowStatus()
  await loadFollowStats()
})
watch(
  () => authStore.isAuthenticated,
  () => {
    loadBookmarkStatus()
    loadLikeStatus()
    loadFollowStatus()
    loadFollowStats()
  },
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="detail-page-content d-grid gap-3">
      <p v-if="artworkStore.loading" class="text-secondary mb-0">{{ $t('artwork.loadingDetail') }}</p>
      <p v-else-if="artworkStore.error" class="text-danger mb-0">{{ artworkStore.error }}</p>

      <!-- Novel Reader -->
      <template v-else-if="displayArtwork && artwork?.type === 'novel'">
        <div class="novel-detail-layout d-grid gap-4 mx-auto">
          <div class="detail-main">
            <div class="left-col">
              <NovelReader
                :artwork="displayArtwork"
                :novel-content="novelContent"
                :word-count="displayArtwork.wordCount || 0"
                :reading-time="displayArtwork.readingTime || 0"
                :is-liked="isLiked"
                :is-bookmarked="isBookmarked"
                :like-loading="likeLoading"
                :bookmark-loading="bookmarkLoading"
                :initial-scroll-position="readingScrollPosition"
                :last-read-at="readingLastReadAt"
                @progress-change="handleProgressChange"
                @toggle-like="handleLikeToggle"
                @toggle-bookmark="handleBookmarkToggle"
                @scroll-change="handleScrollChange"
              />

              <!-- Series navigation for novels (prev/next artwork in series) -->
              <div v-if="seriesArtworkIds.length > 1" class="series-nav-bar">
                <router-link
                  v-if="seriesPrevId"
                  :to="`/artworks/${seriesPrevId}`"
                  class="series-nav-btn"
                >
                  <i class="fa-solid fa-chevron-left"></i>
                  Previous
                </router-link>
                <router-link
                  :to="`/series/${seriesInfo?._id}`"
                  class="series-nav-info"
                >
                  <i class="fa-solid fa-images"></i>
                  {{ seriesInfo?.title }}
                </router-link>
                <router-link
                  v-if="seriesNextId"
                  :to="`/artworks/${seriesNextId}`"
                  class="series-nav-btn"
                >
                  Next
                  <i class="fa-solid fa-chevron-right"></i>
                </router-link>
              </div>

              <!-- Pixiv-like In-Content Author Card -->
              <div v-if="artwork?.user" class="in-content-author-card">
                <div class="author-card-header">
                  <img 
                    :src="artistAvatar" 
                    :alt="displayAuthor" 
                    class="author-card-avatar"
                    @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'"
                  />
                  <div class="author-card-meta">
                    <router-link :to="`/account?user=${artistId}`" class="author-card-name">
                      {{ displayAuthor }}
                    </router-link>
                    <p class="author-card-stats">
                      {{ $t('profile.followers') }} {{ artistFollowersCount }} · {{ $t('profile.following') }} {{ artistFollowingCount }}
                    </p>
                  </div>
                  <button
                    v-if="!isOwnArtist"
                    type="button"
                    class="btn btn-sm author-card-follow-btn"
                    :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary'"
                    :disabled="followLoading"
                    @click="handleFollowToggle"
                  >
                    {{ isFollowing ? $t('artwork.following') : $t('artwork.follow') }}
                  </button>
                </div>
              </div>
            </div>
            <ArtworkDetailSidebar
              :display-author="displayAuthor"
              :artist-id="artistId"
              :artist-avatar="artistAvatar"
              :is-own-artist="isOwnArtist"
              :is-following="isFollowing"
              :follow-loading="followLoading"
              :follow-error="followError"
              :artist-followers-count="artistFollowersCount"
              :artist-following-count="artistFollowingCount"
              :same-author-works="sameAuthorWorks"
              @toggle-follow="handleFollowToggle"
            />
          </div>
          <section class="below-shell d-grid gap-3 mt-4">
            <ArtworkDetailCommentsCard :artwork-id="artwork._id" :artwork-owner-id="artwork.user?._id" />
          </section>
          <ArtworkDetailRelatedGrid class="mt-5" :related-works="relatedWorks" />
        </div>
      </template>

      <!-- Standard Artwork Detail (for illust, manga, gif) -->
      <div v-else-if="displayArtwork" class="artwork-detail-wrapper">
        <div v-if="hasSeriesNavigation" class="series-nav-bar">
          <router-link
            v-if="seriesPrevId"
            :to="`/artworks/${seriesPrevId}`"
            class="series-nav-btn"
          >
            <i class="fa-solid fa-chevron-left"></i>
            Previous
          </router-link>
          <router-link
            :to="`/series/${seriesInfo?._id}`"
            class="series-nav-info"
          >
            <i class="fa-solid fa-images"></i>
            {{ seriesInfo?.title }}
          </router-link>
          <router-link
            v-if="seriesNextId"
            :to="`/artworks/${seriesNextId}`"
            class="series-nav-btn"
          >
            Next
            <i class="fa-solid fa-chevron-right"></i>
          </router-link>
        </div>

        <ArtworkDetailCard
          :artwork="displayArtwork"
          :display-author="displayAuthor"
          :artist-id="artistId"
          :is-own-artist="isOwnArtist"
          :related-works="relatedWorks"
          :is-liked="isLiked"
          :like-loading="likeLoading"
          :like-error="likeError"
          :is-bookmarked="isBookmarked"
          :bookmark-loading="bookmarkLoading"
          :bookmark-error="bookmarkError"
          :is-following="isFollowing"
          :follow-loading="followLoading"
          :follow-error="followError"
          :artist-followers-count="artistFollowersCount"
          :artist-following-count="artistFollowingCount"
          @toggle-like="handleLikeToggle"
          @toggle-bookmark="handleBookmarkToggle"
          @toggle-follow="handleFollowToggle"
        />
      </div>
      <p v-else class="text-secondary mb-0">{{ $t('artwork.noData') }}</p>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.detail-page-content {
  width: 100%;
  background-color: var(--bg); /* Premium soft background */
  padding: 1.5rem 0 3rem;
  min-height: 100vh;
}

.novel-detail-layout {
  width: 100%;
  max-width: 1120px;
  margin: 0;
}

.novel-detail-layout .detail-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 2.5rem;
  align-items: start;
  position: relative;
}

.novel-detail-layout .left-col {
  min-width: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.novel-detail-layout .below-shell {
  margin-top: 1rem;
}

/* In-Content Author Card style */
.in-content-author-card {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  margin-top: 1rem;
}

.author-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-card-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--line);
}

.author-card-meta {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.author-card-name {
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand);
  text-decoration: none;
  transition: color 0.2s;
}

.author-card-name:hover {
  color: var(--accent);
}

.author-card-stats {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
}

.author-card-follow-btn {
  border-radius: 20px;
  padding: 0.4rem 1.5rem;
  font-weight: 600;
  font-size: 0.85rem;
}

.artwork-detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.series-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.series-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;
}

.series-nav-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.series-nav-info {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
  flex: 1;
  justify-content: center;
}

@media (max-width: 1200px) {
  .novel-detail-layout .detail-main {
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 1rem;
  }
}

@media (max-width: 1000px) {
  .novel-detail-layout .detail-main {
    grid-template-columns: 1fr;
  }
  .novel-detail-layout {
    padding: 0 1rem;
  }
}
</style>
