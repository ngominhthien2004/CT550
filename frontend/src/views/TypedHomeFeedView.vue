<script setup>
import { computed, ref, watch } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import HomeFeedColumn from '../components/home/HomeFeedColumn.vue'
import HomeHeroBanner from '../components/home/HomeHeroBanner.vue'
import HomeRecommendedUsers from '../components/home/HomeRecommendedUsers.vue'
import HomeTabs from '../components/home/HomeTabs.vue'
import HomeTagStrip from '../components/home/HomeTagStrip.vue'
import { getArtworks } from '../services/api'
import { navItems } from '../constants/navigation'
import heroImage from '../assets/hero.png'
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
const novelFormatFilter = ref('all')
const novelSortBy = ref('newest')

const authStore = useAuthStore()
const followStore = useFollowStore()

const heroSlide = computed(() => ({
  title: props.pageTitle,
  image: heroImage,
}))

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

  if (novelFormatFilter.value !== 'all') {
    params.novelFormat = novelFormatFilter.value
  }
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

async function toggleFollowFromHome(userId) {
  if (!userId || !authStore.isAuthenticated) {
    return
  }

  await followStore.toggleFollowByUser(userId)
}

watch(
  () => props.workType,
  async () => {
    await loadTypedArtworks()
  },
  { immediate: true },
)

watch(
  [novelFormatFilter, novelSortBy],
  async () => {
    if (props.workType === 'novel') {
      await loadTypedArtworks()
    }
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="typed-home-page">
      <div class="typed-home-main-column">
        <HomeTabs />

        <!-- Novel-specific filter bar -->
        <div v-if="isNovelPage" class="novel-filter-bar">
          <div class="novel-filter-tabs">
            <button
              type="button"
              class="nf-tab"
              :class="{ 'is-active': novelFormatFilter === 'all' }"
              @click="novelFormatFilter = 'all'"
            >All</button>
            <button
              type="button"
              class="nf-tab"
              :class="{ 'is-active': novelFormatFilter === 'oneshot' }"
              @click="novelFormatFilter = 'oneshot'"
            >One-shot</button>
            <button
              type="button"
              class="nf-tab"
              :class="{ 'is-active': novelFormatFilter === 'series' }"
              @click="novelFormatFilter = 'series'"
            >Series</button>
          </div>
          <label class="nf-sort">
            <select v-model="novelSortBy">
              <option value="newest">Newest</option>
              <option value="views">Most viewed</option>
              <option value="likes">Most liked</option>
            </select>
          </label>
        </div>

        <HomeTagStrip :tags="liveTags" />
        <HomeHeroBanner :slide="heroSlide" />
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

.novel-filter-tabs {
  display: inline-flex;
  gap: 0.2rem;
}

.nf-tab {
  border: none;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 0.82rem;
  padding: 0.35rem 0.7rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.nf-tab.is-active {
  color: var(--accent);
  background: #eff6ff;
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
