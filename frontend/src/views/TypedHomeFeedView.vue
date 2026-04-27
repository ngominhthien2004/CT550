<script setup>
import { computed, ref, watch } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
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

const authStore = useAuthStore()
const followStore = useFollowStore()

const heroSlide = computed(() => ({
  title: props.pageTitle,
  image: heroImage,
}))

const featuredWorks = computed(() =>
  liveWorks.value.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
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
    const { data } = await getArtworks({ limit: 48, type: props.workType })
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
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="typed-home-page">
      <div class="typed-home-main-column">
        <HomeTabs />
        <HomeTagStrip :tags="liveTags" />
        <HomeHeroBanner :slide="heroSlide" />
        <p v-if="isLoading" class="type-loading">Loading {{ pageTitle.toLowerCase() }}...</p>
        <HomeRecommendedUsers
          :users="recommendedUsers"
          :is-authenticated="authStore.isAuthenticated"
          :is-following-user="followStore.isFollowingUser"
          :is-toggling-follow="followStore.isTogglingFollow"
          @toggle-follow="toggleFollowFromHome"
        />
        <HomeArtworkGrid :works="featuredWorks" />
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
  color: #54607b;
  font-weight: 600;
}
</style>
