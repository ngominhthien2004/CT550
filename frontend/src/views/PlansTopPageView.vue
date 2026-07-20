<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { HomeTabs } from '@/components/home'
import PlansHero from '../components/plans/PlansHero.vue'
import CreatorsStrip from '../components/plans/CreatorsStrip.vue'
import PlanCard from '../components/plans/PlanCard.vue'
import { requestApi } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useFollowStore } from '../stores/follow.store'

const { t } = useI18n()
const isNavCollapsed = ref(true)
const loading = ref(false)
const loadError = ref('')
const plans = ref([])
const authStore = useAuthStore()
const followStore = useFollowStore()
const router = useRouter()

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

const creatorMap = computed(() => {
  const map = {}
  plans.value.forEach((plan) => {
    const creator = plan.creator
    if (creator?._id && !map[creator._id]) {
      map[creator._id] = {
        _id: creator._id,
        username: creator.username || '',
        displayName: creator.displayName || creator.username || 'Unknown',
        avatar: creator.avatar || '',
        planCount: 0,
      }
    }
    if (creator?._id) {
      map[creator._id].planCount++
    }
  })
  return map
})

const creators = computed(() =>
  Object.values(creatorMap.value).filter((c) => c._id !== authStore.user?._id),
)

const topPlans = computed(() =>
  [...plans.value].sort((a, b) => b.targetPrice - a.targetPrice).slice(0, 6),
)

const newestPlans = computed(() =>
  [...plans.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12),
)

const plansByWorkType = computed(() => {
  const groups = {}
  plans.value.forEach((plan) => {
    (plan.acceptedWorkTypes || []).forEach((type) => {
      if (!groups[type]) groups[type] = []
      groups[type].push(plan)
    })
  })
  return groups
})

async function loadPlans() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await requestApi.getTerms({ openOnly: 'true' })
    plans.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('loadPlans error:', e)
    plans.value = []
    loadError.value = t('plan.loadFailed')
  } finally {
    loading.value = false
  }
}

async function handleToggleFollow(userId) {
  if (!userId) return
  if (!authStore.isAuthenticated) {
    await router.push({ path: '/login', query: { redirect: '/plans' } })
    return
  }
  await followStore.toggleFollowByUser(userId)
}

onMounted(async () => {
  try {
    await loadPlans()
    if (authStore.isAuthenticated && creators.value.length) {
      await Promise.all(
        creators.value.map((c) => followStore.fetchFollowStatus(c._id).catch(() => null)),
      )
    }
  } catch (e) {
    console.error('PlansTopPageView onMounted error:', e)
    loadError.value = e?.message || t('plan.loadFailed')
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="plans-top-page">
      <HomeTabs />

      <PlansHero :plan-count="plans.length" :creator-count="creators.length" />

      <p v-if="loadError" class="plans-state plans-state--error">{{ loadError }}</p>
      <p v-else-if="loading && !plans.length" class="plans-state">{{ $t('common.loading') }}</p>

      <template v-else-if="plans.length">
        <CreatorsStrip :creators="creators" @toggle-follow="handleToggleFollow" />

        <section class="plans-section">
          <h2 class="section-heading">{{ $t('plan.topByPrice') }}</h2>
          <div class="plans-grid">
            <PlanCard v-for="plan in topPlans" :key="plan._id" :plan="plan" show-accepting show-slots />
          </div>
        </section>

        <section class="plans-section">
          <h2 class="section-heading">{{ $t('plan.newestPlans') }}</h2>
          <div class="plans-grid plans-grid--wide">
            <PlanCard v-for="plan in newestPlans" :key="plan._id" :plan="plan" show-meta />
          </div>
        </section>

        <section v-for="(items, type) in plansByWorkType" :key="type" class="plans-section">
          <h2 class="section-heading">Plans accepting {{ type }}</h2>
          <div class="plans-grid">
            <PlanCard v-for="plan in items.slice(0, 6)" :key="plan._id" :plan="plan" show-accepting show-slots :highlight-type="type" />
          </div>
        </section>
      </template>

      <div v-else class="plans-empty">
        <p>No open commission plans at the moment. Check back later.</p>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.plans-top-page {
  display: block;
  padding: 0.4rem 0;
}

.plans-top-page > :deep(*:not(:last-child)) {
  margin-bottom: 0.85rem;
}

.plans-state {
  margin: 0;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--muted);
  font-weight: 600;
}

.plans-state--error {
  color: var(--danger);
  background: rgba(180, 35, 24, 0.06);
  border-color: rgba(180, 35, 24, 0.16);
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brand);
  margin: 0 0 0.75rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.85rem;
}

.plans-grid--wide {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.plans-empty {
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 2rem 1.5rem;
  text-align: center;
  color: var(--muted);
  font-weight: 600;
}

@media (max-width: 640px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
