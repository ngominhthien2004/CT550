<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { translateError } from '../../utils/translateError.js'
import { useAuthStore } from '../../stores/auth.store'
import { getArtworks } from '../../services/api'
import CreatorRecentlyUploadedPanel from './CreatorRecentlyUploadedPanel.vue'
import CreatorReactionsCard from './CreatorReactionsCard.vue'

const emit = defineEmits(['view-details'])

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const user = computed(() => authStore.user)
const artworks = ref([])
const loading = ref(false)
const error = ref('')
const onboardingStep = ref(0)
const hasSeenGuide = ref(false)
const onboardingKeyPrefix = 'dashboardOnboardingSeen:'

const recentArtworks = computed(() => artworks.value.slice(0, 3))

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
    error.value = translateError(fetchError, t, 'dashboard.loadFailed')
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
    return t('dashboard.hideGuide')
  }
  return hasSeenGuide.value ? t('dashboard.showGuide') : t('dashboard.startGuide')
})

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
  <div class="dashboard-home">
    <CreatorRecentlyUploadedPanel :recent-artworks="recentArtworks" @post="goUpload" />

    <div class="dashboard-grid" v-if="!loading && !error">
      <CreatorReactionsCard :stats="reactionStats" @view-details="$emit('view-details')" />
    </div>

    <p v-if="loading" class="state-note">{{ $t('dashboard.loadingDashboard') }}</p>
    <p v-else-if="error" class="state-note state-note--error">{{ error }}</p>

    <!-- Coachmark modal -->
    <Teleport to="body">
      <div v-if="onboardingStep > 0" class="coachmark-overlay" @click.self="finishOnboarding">
        <div class="coachmark-modal">
          <div class="coachmark-header">
            <h2>{{ onboardingStep === 1 ? $t('dashboard.welcome') : $t('dashboard.discoverMore') }}</h2>
            <button type="button" class="coachmark-close-btn" @click="finishOnboarding">&times;</button>
          </div>
          <div class="coachmark-body">
            <p v-if="onboardingStep === 1" class="coachmark-text">{{ $t('dashboard.coachmarkStep1Body') }}</p>
            <p v-else class="coachmark-text">{{ $t('dashboard.coachmarkStep2Body') }}</p>
          </div>
          <div class="coachmark-footer">
            <button type="button" class="coachmark-btn" @click="onboardingStep === 1 ? nextOnboardingStep() : finishOnboarding()">
              {{ onboardingStep === 1 ? $t('dashboard.next') : $t('dashboard.tryItNow') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dashboard-home {
  margin-top: 0.5rem;
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

.state-note {
  color: var(--muted);
  font-weight: 600;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
}

/* Coachmark modal */
.coachmark-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.coachmark-modal {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  width: 420px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  color: var(--text);
}

.coachmark-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.coachmark-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: inherit;
}

.coachmark-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coachmark-close-btn:hover {
  background: var(--surface-alt);
  color: var(--surface);
}

.coachmark-body {
  padding: 20px;
}

.coachmark-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.coachmark-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid var(--line);
}

.coachmark-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: var(--accent);
  color: var(--surface);
  transition: background 0.15s ease;
}

.coachmark-btn:hover {
  background: #5b7df8;
}
</style>
