<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { CreatorDashboardTabs, CreatorRecentlyUploadedPanel, CreatorReactionsCard, DashboardReactionsPanel } from '@/components/dashboard'
import DashboardWorksPanel from '@/components/dashboard/DashboardWorksPanel.vue'

import { useAuthStore } from '../stores/auth.store'
import { getArtworks } from '../services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const artworks = ref([])
const loading = ref(false)
const error = ref('')
const onboardingStep = ref(0)
const hasSeenGuide = ref(false)
const onboardingKeyPrefix = 'dashboardOnboardingSeen:'
const activeTab = ref('home')

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
    finishOnboarding()
    return
  }
  onboardingStep.value += 1
}

function finishOnboarding() {
  onboardingStep.value = 0
  if (!user.value?._id) {
    return
  }
  try {
    localStorage.setItem(`${onboardingKeyPrefix}${user.value._id}`, 'true')
    hasSeenGuide.value = true
  } catch (_error) {
    // Ignore storage errors so the UI remains usable.
  }
}

function startOnboarding() {
  if (!user.value?._id) {
    return
  }
  if (onboardingStep.value > 0) {
    finishOnboarding()
    return
  }
  onboardingStep.value = 1
}

function initOnboarding() {
  if (!user.value?._id) {
    onboardingStep.value = 0
    return
  }

  try {
    const seen = localStorage.getItem(`${onboardingKeyPrefix}${user.value._id}`)
    onboardingStep.value = seen ? 0 : 1
    hasSeenGuide.value = Boolean(seen)
  } catch (_error) {
    onboardingStep.value = 1
    hasSeenGuide.value = false
  }
}

const guideLabel = computed(() => {
  if (onboardingStep.value > 0) {
    return 'Hide guide'
  }
  return hasSeenGuide.value ? 'Show guide' : 'Start guide'
})

async function goLogin() {
  await router.push('/login')
}

async function goUpload() {
  await router.push('/upload/illust')
}

onMounted(() => {
  initOnboarding()
  loadDashboard()
})

watch(
  () => user.value?._id,
  () => {
    initOnboarding()
    loadDashboard()
  },
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="user" class="dashboard-page">
      <div class="dashboard-wrap">
        <div class="dashboard-hero">
          <div class="dashboard-hero-inner">
            <p class="dashboard-hero-kicker">Creator Dashboard</p>
            <h1 class="dashboard-hero-title">Welcome back, {{ user.displayName || user.username }}</h1>
            <p class="dashboard-hero-desc">Track your works, reactions, and performance at a glance.</p>
            <div class="dashboard-hero-stats">
              <span class="stat-pill">{{ artworks.length }} work{{ artworks.length !== 1 ? 's' : '' }}</span>
              <span class="stat-pill">{{ reactionStats.views.toLocaleString() }} views</span>
              <span class="stat-pill">{{ reactionStats.likes.toLocaleString() }} likes</span>
            </div>
          </div>
          <button type="button" class="guide-btn" :class="{ 'is-active': onboardingStep > 0 }" @click="startOnboarding">
            <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
            {{ guideLabel }}
          </button>
        </div>

        <CreatorDashboardTabs v-model="activeTab" />

        <!-- Home tab content -->
        <template v-if="activeTab === 'home'">
          <CreatorRecentlyUploadedPanel :latest-artwork="latestArtwork" @post="goUpload" />

          <div class="dashboard-grid" v-if="!loading && !error">
            <CreatorReactionsCard :stats="reactionStats" @view-details="activeTab = 'reactions'" />
          </div>

          <p v-if="loading" class="state-note">Loading dashboard...</p>
          <p v-else-if="error" class="state-note state-note--error">{{ error }}</p>

          <div v-if="onboardingStep > 0" class="coachmark-backdrop" @click.self="finishOnboarding" @keydown.enter.prevent="finishOnboarding" @keydown.space.prevent="finishOnboarding" tabindex="0" role="button">
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
        </template>

        <!-- Works tab content -->
        <DashboardWorksPanel v-if="activeTab === 'works'" />

        <!-- Reactions tab content -->
        <DashboardReactionsPanel v-if="activeTab === 'reactions'" />
      </div>
    </section>

    <section v-else class="dashboard-page">
      <div class="dashboard-wrap">
        <div class="dashboard-hero">
          <div class="dashboard-hero-inner">
            <p class="dashboard-hero-kicker">Creator Dashboard</p>
            <h1 class="dashboard-hero-title">Dashboard</h1>
            <p class="dashboard-hero-desc">You are not logged in.</p>
            <button type="button" class="hero-cta" @click="goLogin">Go to login</button>
          </div>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.dashboard-page {
  display: block;
  padding: 0.4rem 0;
}

.dashboard-wrap {
  display: grid;
  gap: 0.85rem;
}

.dashboard-hero {
  border-radius: 16px;
  background: linear-gradient(135deg, #0096fa 0%, #7c3aed 100%);
  padding: 2.2rem 2rem;
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-hero-inner {
  max-width: 600px;
}

.dashboard-hero-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
  margin: 0 0 0.4rem;
}

.dashboard-hero-title {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 0.5rem;
  color: inherit;
}

.dashboard-hero-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 0.9rem;
}

.dashboard-hero-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.guide-btn {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.guide-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.guide-btn.is-active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.hero-cta {
  border: none;
  border-radius: 999px;
  background: #fff;
  color: #0096fa;
  font-weight: 800;
  padding: 0.65rem 1.2rem;
  font-size: 0.88rem;
  cursor: pointer;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.85rem;
  align-items: start;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-hero {
    flex-direction: column;
    padding: 1.4rem 1.2rem;
  }

  .dashboard-hero-title {
    font-size: 1.35rem;
  }

  .guide-btn {
    align-self: flex-start;
  }
}
</style>
