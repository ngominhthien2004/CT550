<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArtworkDetailCard from '../components/artwork/ArtworkDetailCard.vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { getArtworks } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useArtworkStore } from '../stores/artwork.store'
import { useBookmarkStore } from '../stores/bookmark.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const artworkStore = useArtworkStore()
const bookmarkStore = useBookmarkStore()
const isNavCollapsed = ref(true)
const relatedWorks = ref([])
const isBookmarked = ref(false)
const localBookmarkCount = ref(0)
const bookmarkError = ref('')

const artworkId = computed(() => route.params.id)
const artwork = computed(() => artworkStore.detail)
const displayArtwork = computed(() => {
  if (!artwork.value) {
    return null
  }

  return {
    ...artwork.value,
    bookmarkCount: localBookmarkCount.value,
  }
})
const bookmarkLoading = computed(() => bookmarkStore.isTogglingBookmark(artworkId.value))
const displayAuthor = computed(() => {
  if (!artwork.value?.user) return 'Unknown artist'
  return artwork.value.user.displayName || artwork.value.user.username || 'Unknown artist'
})

function syncBookmarkCountFromArtwork() {
  localBookmarkCount.value = Number(artwork.value?.bookmarkCount || 0)
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

async function loadArtwork() {
  if (artworkId.value) {
    await artworkStore.fetchArtworkDetail(artworkId.value)
    syncBookmarkCountFromArtwork()
    await loadBookmarkStatus()
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

onMounted(loadArtwork)
watch(artworkId, loadArtwork)
watch(artwork, syncBookmarkCountFromArtwork)
watch(
  () => authStore.isAuthenticated,
  () => {
    loadBookmarkStatus()
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="detail-page-content d-grid gap-3">
      <p v-if="artworkStore.loading" class="text-secondary mb-0">Loading artwork detail...</p>
      <p v-else-if="artworkStore.error" class="text-danger mb-0">{{ artworkStore.error }}</p>

      <ArtworkDetailCard
        v-else-if="displayArtwork"
        :artwork="displayArtwork"
        :display-author="displayAuthor"
        :related-works="relatedWorks"
        :is-bookmarked="isBookmarked"
        :bookmark-loading="bookmarkLoading"
        :bookmark-error="bookmarkError"
        @toggle-bookmark="handleBookmarkToggle"
      />
      <p v-else class="text-secondary mb-0">No artwork data found.</p>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.detail-page-content {
  width: 100%;
}
</style>
