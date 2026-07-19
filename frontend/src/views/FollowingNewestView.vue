<script setup>
import { computed, onMounted, ref } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { HomeArtworkGrid, HomeFeedColumn, HomeTagStrip, HomeTabs } from '@/components/home'
import { getFeed, getTags } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useLikeStore } from '../stores/like.store'

const isNavCollapsed = ref(true)
const liveWorks = ref([])
const liveTags = ref([])
const loading = ref(false)
const error = ref('')
const authStore = useAuthStore()
const likeStore = useLikeStore()

const normalizedWorks = computed(() =>
  liveWorks.value.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

const spotlightWorks = computed(() => normalizedWorks.value.slice(0, 12))
const feedWorks = computed(() => normalizedWorks.value.slice(12))

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadFollowingWorks() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getFeed({ limit: 48 })
    const items = Array.isArray(data.artworks) ? data.artworks : []
    liveWorks.value = items
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load followed works'
    liveWorks.value = []
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  try {
    const { data } = await getTags({ limit: 12 })
    liveTags.value = Array.isArray(data)
      ? data.map((item) => `#${item.name}`)
      : []
  } catch { liveTags.value = [] }
}

onMounted(() => {
  Promise.all([loadFollowingWorks(), loadTags()])
  if (authStore.isAuthenticated) {
    likeStore.fetchMyLikes({ limit: 120 })
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="following-page">
      <div class="following-main">
        <HomeTabs />
        <HomeTagStrip :tags="liveTags" />
        <HomeArtworkGrid :works="spotlightWorks" />

        <p v-if="loading && liveWorks.length === 0" class="state-note">Loading artworks from followed users...</p>
        <p v-else-if="error" class="state-note error">{{ error }}</p>
        <p v-else-if="!loading && liveWorks.length === 0" class="state-note">
          No artworks from followed users. Follow more artists to see their works here!
        </p>

        <HomeFeedColumn :works="feedWorks" />
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.following-page {
  display: block;
}

.following-main {
  display: grid;
  gap: 0.8rem;
  min-width: 0;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.state-note {
  margin: 0;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}
</style>
