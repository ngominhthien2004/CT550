<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import CreatorDashboardTabs from '../components/dashboard/CreatorDashboardTabs.vue'
import CreatorRecentlyUploadedPanel from '../components/dashboard/CreatorRecentlyUploadedPanel.vue'
import CreatorReactionsCard from '../components/dashboard/CreatorReactionsCard.vue'
import CreatorThemeCard from '../components/dashboard/CreatorThemeCard.vue'
import CreatorContestCard from '../components/dashboard/CreatorContestCard.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { getArtworks } from '../services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const artworks = ref([])
const loading = ref(false)
const error = ref('')
const onboardingStep = ref(1)

const latestArtwork = computed(() => artworks.value[0] || null)

const reactionStats = computed(() => {
  return artworks.value.reduce(
    (acc, item) => {
      acc.views += Number(item.viewCount || 0)
      acc.likes += Number(item.likeCount || 0)
      acc.bookmarks += Number(item.bookmarkCount || 0)
      acc.comments += Number(item.commentCount || 0)
      return acc
    },
    {
      views: 0,
      likes: 0,
      bookmarks: 0,
      comments: 0,
    },
  )
})

function normalizeArtwork(item) {
  return {
    ...item,
    image: item.images?.[0] || '',
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadDashboard() {
  if (!user.value?._id) {
    artworks.value = []
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await getArtworks({ user: user.value._id, limit: 120 })
    artworks.value = Array.isArray(data) ? data.map(normalizeArtwork) : []
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load dashboard data'
    artworks.value = []
  } finally {
    loading.value = false
  }
}

function nextOnboardingStep() {
  if (onboardingStep.value >= 2) {
    onboardingStep.value = 0
    return
  }
  onboardingStep.value += 1
}

function finishOnboarding() {
  onboardingStep.value = 0
}

async function goLogin() {
  await router.push('/login')
}

async function goUpload() {
  await router.push('/upload/illust')
}

onMounted(() => {
  loadDashboard()
})

watch(
  () => user.value?._id,
  () => {
    loadDashboard()
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="user" class="dashboard-page page-block">
      <div class="dashboard-wrap">
        <header class="dashboard-head">
          <h1>Dashboard</h1>
          <CreatorDashboardTabs />
        </header>

        <CreatorRecentlyUploadedPanel :latest-artwork="latestArtwork" @post="goUpload" />

        <div class="dashboard-grid" v-if="!loading && !error">
          <CreatorReactionsCard :stats="reactionStats" />
          <CreatorThemeCard />
          <CreatorContestCard />
          <article class="pr-card">PR</article>
        </div>

        <p v-if="loading" class="state-note">Loading dashboard...</p>
        <p v-else-if="error" class="state-note error">{{ error }}</p>

        <div v-if="onboardingStep > 0" class="coachmark-backdrop" @click.self="finishOnboarding">
          <div class="coachmark-card">
            <p v-if="onboardingStep === 1" class="coachmark-text">
              Up to three recent posts will be displayed.
              The numbers are updated in real-time and the increase since your last visit to the Dashboard is shown in blue text.
            </p>
            <p v-else class="coachmark-text">
              Other content will be displayed, making it easier for you to get feedback on your work,
              as well as finding new content recommended for you. This content changes regularly.
            </p>

            <button type="button" class="coachmark-btn" @click="onboardingStep === 1 ? nextOnboardingStep() : finishOnboarding()">
              {{ onboardingStep === 1 ? 'Next' : 'Try it now' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Dashboard</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.dashboard-page {
  background: #f3f4f6;
  min-height: calc(100vh - 112px);
}

.dashboard-wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.35rem 0.95rem 1.6rem;
  position: relative;
}

.dashboard-head {
  display: grid;
  gap: 0.82rem;
}

.dashboard-head h1 {
  font-size: 2.25rem;
  color: #1f2937;
}

.dashboard-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.85rem;
  align-items: start;
}

.pr-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 18px;
  min-height: 68px;
  padding: 0.75rem 0.9rem;
  color: #374151;
  font-weight: 700;
}

.state-note {
  margin-top: 0.95rem;
  color: #4b5563;
  font-weight: 600;
}

.state-note.error {
  color: #dc2626;
}

.coachmark-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.58);
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.coachmark-card {
  width: min(430px, 100%);
  border-radius: 16px;
  padding: 1.2rem 1rem 1rem;
  color: #fff;
  text-align: center;
}

.coachmark-text {
  font-size: 2rem;
  line-height: 1.35;
  font-weight: 700;
}

.coachmark-btn {
  margin-top: 0.7rem;
  height: 38px;
  border-radius: 999px;
  border: none;
  min-width: 96px;
  padding: 0 1rem;
  background: #0ea5e9;
  color: #fff;
  font-size: 0.86rem;
  font-weight: 700;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .dashboard-wrap {
    padding-inline: 0.7rem;
  }

  .dashboard-head h1 {
    font-size: 1.42rem;
  }

  .coachmark-text {
    font-size: 1rem;
  }
}

@media (min-width: 1100px) {
  .dashboard-page {
    padding-inline: 0.2rem;
  }

  .dashboard-wrap {
    max-width: 1000px;
  }

  .dashboard-grid {
    grid-template-columns: 300px 1fr 300px;
  }

  .pr-card {
    grid-column: 1 / 2;
  }
}
</style>
