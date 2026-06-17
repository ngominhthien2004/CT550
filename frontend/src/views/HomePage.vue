<script setup>
import { computed, onMounted, ref } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { HomeArtworkGrid, HomeFeedColumn, HomeHeroBanner, HomeRecommendedUsers, HomeTabs, HomeTagStrip } from '@/components/home'
import { getArtworks, getTags } from '../services/api'
import api from '../services/api'

import heroImage from '../assets/hero.png'
import { useFollowStore } from '../stores/follow.store'
import { useAuthStore } from '../stores/auth.store'

const isNavCollapsed = ref(true)
const liveWorks = ref([])
const liveTags = ref([])
const recommendedUsers = ref([])
const forYouWorks = ref([])
const heroSlide = {
  title: 'Featured gallery',
  image: heroImage,
}
const authStore = useAuthStore()
const followStore = useFollowStore()

const normalizedWorks = computed(() =>
  liveWorks.value.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

const spotlightWorks = computed(() => normalizedWorks.value.slice(0, 12))
const feedWorks = computed(() => normalizedWorks.value.slice(12, 26))
const displayFeedWorks = computed(() => {
  if (authStore.isAuthenticated && forYouWorks.value.length > 0) {
    return forYouWorks.value
  }
  return feedWorks.value
})

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
        avatar: user.avatar || '',
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
      // Filter out novels — novels only show in the Novel tab
      const filtered = data.filter(item => item?.type !== 'novel')
      liveWorks.value = filtered
      normalizeRecommendedUsers(filtered)

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

async function loadForYou() {
  if (!authStore.isAuthenticated) return
  try {
    const { data } = await api.get('/feed/for-you?limit=14')
    if (data?.artworks?.length) {
      forYouWorks.value = data.artworks
    }
  } catch (_error) {
    // Silently fall back to default feed
  }
}

onMounted(async () => {
  await Promise.all([loadHomeArtworks(), loadHomeTags()])
  await loadForYou()
})

async function toggleFollowFromHome(userId) {
  if (!userId || !authStore.isAuthenticated) {
    return
  }

  await followStore.toggleFollowByUser(userId)
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="home-page">
      <div class="home-main-column">
        <HomeTabs />
        <HomeTagStrip :tags="liveTags" />
        <HomeHeroBanner :slide="heroSlide" />
        <HomeArtworkGrid :works="spotlightWorks" />

        <div class="home-feed-layout">
          <HomeFeedColumn :works="displayFeedWorks" />

          <aside class="home-feed-sidebar">
            <HomeRecommendedUsers
              :users="recommendedUsers"
              :is-authenticated="authStore.isAuthenticated"
              :is-following-user="followStore.isFollowingUser"
              :is-toggling-follow="followStore.isTogglingFollow"
              @toggle-follow="toggleFollowFromHome"
            />

            <!-- AI Chat -->
            <div class="ai-chat-card">
              <div class="ai-chat-card-icon">🤖</div>
              <h4 class="ai-chat-card-title">AI Assistant</h4>
              <p class="ai-chat-card-desc">
                Tìm kiếm artwork, gợi ý tác phẩm và tóm tắt nội dung với trợ lý thông minh
              </p>
              <router-link to="/chat" class="btn btn-primary btn-sm w-100">
                <i class="fas fa-comment-dots me-1"></i> Chat với AI
              </router-link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.home-page {
  display: block;
}

.home-main-column {
  display: grid;
  gap: 0.8rem;
  min-width: 0;
}

.home-feed-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 0.8rem;
}

.home-feed-sidebar {
  position: sticky;
  top: 0.45rem;
  align-self: start;
}

.ai-chat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1rem;
  color: #fff;
  margin-top: 0.8rem;
}

.ai-chat-card-icon {
  font-size: 1.75rem;
  margin-bottom: 0.4rem;
}

.ai-chat-card-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  color: #fff;
}

.ai-chat-card-desc {
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.75rem;
}

.ai-chat-card .btn-primary {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 999px;
  font-weight: 600;
  transition: background 0.2s;
}

.ai-chat-card .btn-primary:hover {
  background: rgba(255, 255, 255, 0.35);
  color: #fff;
}

@media (max-width: 920px) {
  .home-feed-layout {
    grid-template-columns: 1fr;
  }

  .home-feed-sidebar {
    position: static;
  }
}
</style>
