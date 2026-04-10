<script setup>
import { computed, onMounted, ref } from 'vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import HomeHeroBanner from '../components/home/HomeHeroBanner.vue'
import HomeRecommendedUsers from '../components/home/HomeRecommendedUsers.vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeTabs from '../components/home/HomeTabs.vue'
import HomeTagStrip from '../components/home/HomeTagStrip.vue'
import { getArtworks, getTags } from '../services/api'
import { navItems } from '../constants/navigation'
import heroImage from '../assets/hero.png'
import { useFollowStore } from '../stores/follow.store'
import { useAuthStore } from '../stores/auth.store'

const isNavCollapsed = ref(true)
const liveWorks = ref([])
const liveTags = ref([])
const recommendedUsers = ref([])
const heroSlide = {
  title: 'Featured gallery',
  image: heroImage,
}
const authStore = useAuthStore()
const followStore = useFollowStore()

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

async function loadHomeArtworks() {
  try {
    const { data } = await getArtworks({ limit: 48 })
    if (Array.isArray(data) && data.length > 0) {
      liveWorks.value = data
      normalizeRecommendedUsers(data)

      if (authStore.isAuthenticated) {
        await Promise.all(
          recommendedUsers.value.map((item) => followStore.fetchFollowStatus(item._id).catch(() => null)),
        )
      }
      return
    }

    liveWorks.value = []
    recommendedUsers.value = []
  } catch (_error) {
    liveWorks.value = []
    recommendedUsers.value = []
  }
}

async function loadHomeTags() {
  try {
    const { data } = await getTags({ limit: 12 })
    liveTags.value = Array.isArray(data)
      ? data.map((item) => `#${item.name}`)
      : []
  } catch (_error) {
    liveTags.value = []
  }
}

onMounted(async () => {
  await Promise.all([loadHomeArtworks(), loadHomeTags()])
})

async function toggleFollowFromHome(userId) {
  if (!userId || !authStore.isAuthenticated) {
    return
  }

  await followStore.toggleFollowByUser(userId)
}
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <HomeTagStrip :tags="liveTags" />
    <HomeTabs />
    <HomeHeroBanner :slide="heroSlide" />
    <HomeRecommendedUsers
      :users="recommendedUsers"
      :is-authenticated="authStore.isAuthenticated"
      :is-following-user="followStore.isFollowingUser"
      :is-toggling-follow="followStore.isTogglingFollow"
      @toggle-follow="toggleFollowFromHome"
    />
    <HomeArtworkGrid :works="featuredWorks" />
  </MainLayoutTemplate>
</template>
