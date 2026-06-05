<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArtworkDetailCard from '../components/artwork/ArtworkDetailCard.vue'
import ArtworkDetailSidebar from '../components/artwork/detail/ArtworkDetailSidebar.vue'
import ArtworkDetailCommentsCard from '../components/artwork/detail/ArtworkDetailCommentsCard.vue'
import ArtworkDetailRelatedGrid from '../components/artwork/detail/ArtworkDetailRelatedGrid.vue'
import NovelReader from '../components/novel/NovelReader.vue'
import ChapterManager from '../components/novel/ChapterManager.vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { getArtworks, getChapters, getChapter, getReadingProgress, saveReadingProgress } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useArtworkStore } from '../stores/artwork.store'
import { useBookmarkStore } from '../stores/bookmark.store'
import { useLikeStore } from '../stores/like.store'
import { useFollowStore } from '../stores/follow.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const artworkStore = useArtworkStore()
const bookmarkStore = useBookmarkStore()
const likeStore = useLikeStore()
const followStore = useFollowStore()
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
const chapters = ref([])
const novelContent = ref('')
const currentChapterId = ref(null)
const readingProgress = ref(0)

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
  if (!artwork.value?.user) return 'Unknown artist'
  return artwork.value.user.displayName || artwork.value.user.username || 'Unknown artist'
})
const isOwnArtist = computed(() => {
  if (!artistId.value || !authStore.user?._id) {
    return false
  }
  return artistId.value === authStore.user._id
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
    bookmarkError.value = error?.response?.data?.message || 'Could not load bookmark status'
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
    likeError.value = error?.response?.data?.message || 'Could not load like status'
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
    followError.value = error?.response?.data?.message || 'Could not load follow status'
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
    await artworkStore.fetchArtworkDetail(artworkId.value)
    syncBookmarkCountFromArtwork()
    syncLikeCountFromArtwork()
    await loadNovelData()
    await loadBookmarkStatus()
    await loadLikeStatus()
    await loadFollowStatus()
    await loadFollowStats()
    await loadRelatedWorks()
  }
}

async function loadRelatedWorks() {
  try {
    const { data } = await getArtworks()
    if (!Array.isArray(data)) {
      relatedWorks.value = []
      return
    }

    relatedWorks.value = data
      .filter((item) => item?._id && item._id !== artworkId.value)
      .slice(0, 24)
  } catch (_error) {
    relatedWorks.value = []
  }
}

async function loadNovelData() {
  if (artwork.value?.type !== 'novel') return

  // Load chapters if series
  if (artwork.value?.novelFormat === 'series') {
    try {
      const { data } = await getChapters(artworkId.value)
      chapters.value = Array.isArray(data) ? data : []
    } catch (_err) {
      chapters.value = []
    }
  }

  // Get novel content
  novelContent.value = artwork.value?.novelContent || artwork.value?.description || ''

  // Load reading progress (if authenticated)
  if (authStore.isAuthenticated) {
    try {
      const { data } = await getReadingProgress(artworkId.value)
      if (data?.progressPercent) {
        readingProgress.value = data.progressPercent
      }
    } catch (_err) {
      // Ignore - not critical
    }
  }
}

async function handleSelectChapter(chapterId) {
  currentChapterId.value = chapterId
  try {
    const { data } = await getChapter(artworkId.value, chapterId)
    if (data?.content) {
      novelContent.value = data.content
    }
  } catch (_err) {
    // Fallback
  }
}

async function handleProgressChange({ progressPercent }) {
  if (!authStore.isAuthenticated) return
  try {
    await saveReadingProgress(artworkId.value, {
      progressPercent,
      chapter: currentChapterId.value || null,
    })
  } catch (_err) {
    // Non-critical
  }
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
    likeError.value = error?.response?.data?.message || 'Failed to update like'
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
    bookmarkError.value = error?.response?.data?.message || 'Failed to update bookmark'
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
    followError.value = error?.response?.data?.message || 'Failed to update follow status'
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
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="detail-page-content d-grid gap-3">
      <p v-if="artworkStore.loading" class="text-secondary mb-0">Loading artwork detail...</p>
      <p v-else-if="artworkStore.error" class="text-danger mb-0">{{ artworkStore.error }}</p>

      <!-- Novel Reader -->
      <template v-else-if="displayArtwork && artwork?.type === 'novel'">
        <div class="novel-detail-layout d-grid gap-4 mx-auto">
          <div class="detail-top">
            <div class="left-col">
              <!-- Chapter Manager (only for author of series novels) -->
              <ChapterManager
                v-if="isOwnArtist && artwork.novelFormat === 'series'"
                :artwork-id="artwork._id"
                :chapters="chapters"
                :is-own-artwork="isOwnArtist"
                @chapters-updated="loadNovelData"
              />

              <NovelReader
                :artwork="displayArtwork"
                :novel-content="novelContent"
                :chapters="chapters"
                :word-count="displayArtwork.wordCount || 0"
                :reading-time="displayArtwork.readingTime || 0"
                :is-liked="isLiked"
                :is-bookmarked="isBookmarked"
                :like-loading="likeLoading"
                :bookmark-loading="bookmarkLoading"
                @progress-change="handleProgressChange"
                @select-chapter="handleSelectChapter"
                @toggle-like="handleLikeToggle"
                @toggle-bookmark="handleBookmarkToggle"
              />

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
                      Followers {{ artistFollowersCount }} · Following {{ artistFollowingCount }}
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
                    {{ isFollowing ? 'Following' : 'Follow' }}
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
      <ArtworkDetailCard
        v-else-if="displayArtwork"
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
      <p v-else class="text-secondary mb-0">No artwork data found.</p>
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

.novel-detail-layout .detail-top {
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

@media (max-width: 1200px) {
  .novel-detail-layout .detail-top {
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 1rem;
  }
}

@media (max-width: 1000px) {
  .novel-detail-layout .detail-top {
    grid-template-columns: 1fr;
  }
  .novel-detail-layout {
    padding: 0 1rem;
  }
}
</style>
