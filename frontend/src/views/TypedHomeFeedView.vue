<script setup>
import { computed, ref, watch } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { HomeArtworkGrid, HomeFeedColumn, HomeHeroBanner, HomeRecommendedUsers, HomeTabs, HomeTagStrip } from '@/components/home'
import { getArtworks, bannerApi } from '../services/api'

import { useFollowStore } from '../stores/follow.store'
import { useAuthStore } from '../stores/auth.store'

const props = defineProps({
  workType: {
    type: String,
    required: true,
  },
  pageTitle: {
    type: String,
    required: true,
  },
})

const isNavCollapsed = ref(true)
const isLoading = ref(false)
const liveWorks = ref([])
const liveTags = ref([])
const recommendedUsers = ref([])

// Novel-specific filter state
const novelSortBy = ref('newest')

const authStore = useAuthStore()
const followStore = useFollowStore()

const heroSlide = ref({
  title: '',
  image: '',
})
const bannerLink = ref(null)

const normalizedWorks = computed(() =>
  liveWorks.value.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

const spotlightWorks = computed(() => normalizedWorks.value.slice(0, 12))
const feedWorks = computed(() => normalizedWorks.value.slice(12, 26))
const isNovelPage = computed(() => props.workType === 'novel')

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function buildFilterParams() {
  const params = { limit: 48, type: props.workType }
  if (props.workType !== 'novel') return params

  if (novelSortBy.value !== 'newest') {
    params.sortBy = novelSortBy.value
  }
  return params
}

function normalizeRecommendedUsers(artworks) {
  const userMap = new Map()

  artworks.forEach((item) => {
    const user = item?.user
    if (!user?._id) {
      return
    }

    if (authStore.user?._id && user._id === authStore.user._id) {
      return
    }

    if (!userMap.has(user._id)) {
      userMap.set(user._id, {
        _id: user._id,
        username: user.username || '',
        displayName: user.displayName || user.username || 'Unknown user',
        artworkCount: 0,
      })
    }

    const current = userMap.get(user._id)
    current.artworkCount += 1
  })

  recommendedUsers.value = Array.from(userMap.values())
    .sort((a, b) => b.artworkCount - a.artworkCount)
    .slice(0, 9)
}

function normalizeTags(artworks) {
  const tagMap = new Map()

  artworks.forEach((item) => {
    ;(item.tags || []).forEach((tag) => {
      const rawName = String(tag?.name || '').trim().toLowerCase()
      if (!rawName) {
        return
      }

      const count = tagMap.get(rawName) || 0
      tagMap.set(rawName, count + 1)
    })
  })

  liveTags.value = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name]) => `#${name}`)
}

async function loadTypedArtworks() {
  isLoading.value = true
  try {
    const params = buildFilterParams()
    const { data } = await getArtworks(params)
    const source = Array.isArray(data) ? data : []
    const normalizedWorks = source.filter((item) => item?.type === props.workType)

    liveWorks.value = normalizedWorks
    normalizeRecommendedUsers(normalizedWorks)
    normalizeTags(normalizedWorks)

    if (authStore.isAuthenticated) {
      await Promise.all(
        recommendedUsers.value.map((item) => followStore.fetchFollowStatus(item._id).catch(() => null)),
      )
    }
  } catch (_error) {
    liveWorks.value = []
    liveTags.value = []
    recommendedUsers.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadBanners() {
  try {
    const { data } = await bannerApi.getActive({ type: props.workType })
    if (Array.isArray(data) && data.length > 0) {
      const active = data[0]
      heroSlide.value = {
        title: active.title || props.pageTitle,
        image: active.image || '',
      }
      bannerLink.value = active.link || null
    } else {
      heroSlide.value = { title: props.pageTitle, image: '' }
    }
  } catch (_error) {
    heroSlide.value = { title: props.pageTitle, image: '' }
  }
}

async function loadData() {
  isLoading.value = true
  try {
    await Promise.all([loadTypedArtworks(), loadBanners()])
  } finally {
    isLoading.value = false
  }
}

async function toggleFollowFromHome(userId) {
  if (!userId || !authStore.isAuthenticated) {
    return
  }

  await followStore.toggleFollowByUser(userId)
}

watch(
  () => props.workType,
  async () => {
    await loadData()
  },
  { immediate: true },
)

watch(
  [novelSortBy],
  async () => {
    if (props.workType === 'novel') {
      await loadData()
    }
  },
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="typed-home-page">
      <div class="typed-home-main-column">
        <HomeTabs />

        <!-- Novel-specific filter bar -->
        <div v-if="isNovelPage" class="novel-filter-bar">
          <label class="nf-sort">
            <select v-model="novelSortBy" aria-label="Novel sort by">
              <option value="newest">Newest</option>
              <option value="views">Most viewed</option>
              <option value="likes">Most liked</option>
            </select>
          </label>
        </div>

        <HomeTagStrip :tags="liveTags" />
        <HomeHeroBanner :slide="heroSlide" :banner-link="bannerLink" />
        <p v-if="isLoading" class="type-loading">Loading {{ pageTitle.toLowerCase() }}...</p>
        <HomeArtworkGrid :works="spotlightWorks" />

        <div class="typed-home-feed-layout">
          <HomeFeedColumn :works="feedWorks" />

          <aside class="typed-home-feed-sidebar">
            <HomeRecommendedUsers
              :users="recommendedUsers"
              :is-authenticated="authStore.isAuthenticated"
              :is-following-user="followStore.isFollowingUser"
              :is-toggling-follow="followStore.isTogglingFollow"
              @toggle-follow="toggleFollowFromHome"
            />
          </aside>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.typed-home-page {
  display: block;
}

.typed-home-main-column {
  display: grid;
  gap: 0.8rem;
  min-width: 0;
}

.type-loading {
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

.novel-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.nf-sort select {
  border: none;
  background: var(--surface-alt);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-weight: 700;
  color: var(--text);
  font-size: 0.82rem;
}

.typed-home-feed-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 0.8rem;
}

.typed-home-feed-sidebar {
  position: sticky;
  top: 0.45rem;
  align-self: start;
}

@media (max-width: 920px) {
  .typed-home-feed-layout {
    grid-template-columns: 1fr;
  }

  .typed-home-feed-sidebar {
    position: static;
  }
}
</style>
