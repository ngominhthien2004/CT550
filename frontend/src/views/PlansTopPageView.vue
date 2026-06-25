<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { HomeTabs } from '@/components/home'
import { requestApi } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useFollowStore } from '../stores/follow.store'

const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

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

function formatCurrency(amount, currency = 'USD') {
  return `${currency} ${Number(amount || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return ''
  }
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
        avatar: creator.avatar || DEFAULT_AVATAR,
        planCount: 0,
      }
    }
    if (creator?._id) {
      map[creator._id].planCount++
    }
  })
  return map
})

const creators = computed(() => Object.values(creatorMap.value))

const featuredCreator = computed(() => {
  if (!creators.value.length) return null
  return [...creators.value].sort((a, b) => b.planCount - a.planCount)[0]
})

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
  } catch {
    plans.value = []
    loadError.value = 'Failed to load plans.'
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
  await loadPlans()
  if (authStore.isAuthenticated && creators.value.length) {
    await Promise.all(
      creators.value.map((c) => followStore.fetchFollowStatus(c._id).catch(() => null)),
    )
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="plans-top-page">
      <HomeTabs />

      <div class="plans-hero">
        <div class="plans-hero-inner">
          <p class="plans-hero-kicker">Commission Plans</p>
          <h1 class="plans-hero-title">Open plans from creators</h1>
          <p class="plans-hero-desc">
            Browse active commission plans. Find a creator whose style and terms match what you need.
          </p>
          <div class="plans-hero-stats">
            <span class="stat-pill">{{ plans.length }} open plan{{ plans.length !== 1 ? 's' : '' }}</span>
            <span class="stat-pill">{{ creators.length }} creator{{ creators.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <p v-if="loadError" class="plans-state plans-state--error">{{ loadError }}</p>
      <p v-else-if="loading && !plans.length" class="plans-state">Loading plans...</p>

      <template v-else-if="plans.length">
        <section class="plans-creators-strip">
          <h2 class="section-heading">Creators with open plans</h2>
          <div class="creators-row">
            <router-link
              v-for="creator in creators"
              :key="creator._id"
              :to="{ path: '/account', query: { user: creator._id, tab: 'requests' } }"
              class="creator-chip"
            >
              <img :src="creator.avatar" :alt="creator.displayName" class="creator-avatar" />
              <div class="creator-chip-info">
                <span class="creator-chip-name">{{ creator.displayName }}</span>
                <span class="creator-chip-count">{{ creator.planCount }} plan{{ creator.planCount !== 1 ? 's' : '' }}</span>
              </div>
              <button
                class="follow-btn-sm"
                :class="{ following: followStore.isFollowingUser(creator._id) }"
                :disabled="followStore.isTogglingFollow"
                @click.prevent="handleToggleFollow(creator._id)"
              >
                {{ followStore.isFollowingUser(creator._id) ? 'Following' : 'Follow' }}
              </button>
            </router-link>
          </div>
        </section>

        <section class="plans-section">
          <h2 class="section-heading">Top plans by price</h2>
          <div class="plans-grid">
            <article v-for="plan in topPlans" :key="plan._id" class="plan-card">
              <div class="plan-card-head">
                <router-link
                  :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
                  class="plan-creator-link"
                >
                  <img :src="plan.creator?.avatar || DEFAULT_AVATAR" :alt="plan.creator?.displayName" class="plan-creator-avatar" />
                  <span>{{ plan.creator?.displayName || 'Unknown creator' }}</span>
                </router-link>
                <span class="plan-price">{{ formatCurrency(plan.targetPrice, plan.currency) }}</span>
              </div>
              <h3 class="plan-title">{{ plan.title }}</h3>
              <p class="plan-strengths">{{ plan.strengths }}</p>
              <div class="plan-badges">
                <span class="badge badge-open">Open</span>
                <span class="badge badge-accepting">Accepting requests</span>
              </div>
              <div class="plan-tags">
                <span v-for="type in plan.acceptedWorkTypes" :key="type" class="plan-tag">{{ type }}</span>
                <span class="plan-tag">{{ plan.estimatedDays }} days</span>
                <span class="plan-tag">{{ plan.maxOpenRequests }} slots</span>
              </div>
              <p class="plan-rules">{{ plan.rules }}</p>
              <router-link
                :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
                class="plan-cta"
              >
                View plan
              </router-link>
            </article>
          </div>
        </section>

        <section class="plans-section">
          <h2 class="section-heading">Newest plans</h2>
          <div class="plans-grid plans-grid--wide">
            <article v-for="plan in newestPlans" :key="plan._id" class="plan-card">
              <div class="plan-card-head">
                <router-link
                  :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
                  class="plan-creator-link"
                >
                  <img :src="plan.creator?.avatar || DEFAULT_AVATAR" :alt="plan.creator?.displayName" class="plan-creator-avatar" />
                  <span>{{ plan.creator?.displayName || 'Unknown creator' }}</span>
                </router-link>
                <span class="plan-price">{{ formatCurrency(plan.targetPrice, plan.currency) }}</span>
              </div>
              <h3 class="plan-title">{{ plan.title }}</h3>
              <p class="plan-strengths">{{ plan.strengths }}</p>
              <div class="plan-badges">
                <span class="badge badge-open">Open</span>
              </div>
              <div class="plan-tags">
                <span v-for="type in plan.acceptedWorkTypes" :key="type" class="plan-tag">{{ type }}</span>
                <span class="plan-tag">{{ plan.estimatedDays }} days</span>
              </div>
              <p class="plan-meta">Created {{ formatDate(plan.createdAt) }}</p>
              <router-link
                :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
                class="plan-cta"
              >
                View plan
              </router-link>
            </article>
          </div>
        </section>

        <section v-for="(items, type) in plansByWorkType" :key="type" class="plans-section">
          <h2 class="section-heading">Plans accepting {{ type }}</h2>
          <div class="plans-grid">
            <article v-for="plan in items.slice(0, 6)" :key="plan._id" class="plan-card">
              <div class="plan-card-head">
                <router-link
                  :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
                  class="plan-creator-link"
                >
                  <img :src="plan.creator?.avatar || DEFAULT_AVATAR" :alt="plan.creator?.displayName" class="plan-creator-avatar" />
                  <span>{{ plan.creator?.displayName || 'Unknown creator' }}</span>
                </router-link>
                <span class="plan-price">{{ formatCurrency(plan.targetPrice, plan.currency) }}</span>
              </div>
              <h3 class="plan-title">{{ plan.title }}</h3>
              <div class="plan-tags">
                <span v-for="t in plan.acceptedWorkTypes" :key="t" class="plan-tag" :class="{ 'tag-active': t === type }">{{ t }}</span>
                <span class="plan-tag">{{ plan.estimatedDays }} days</span>
                <span class="plan-tag">{{ plan.maxOpenRequests }} slots</span>
              </div>
              <router-link
                :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
                class="plan-cta"
              >
                View plan
              </router-link>
            </article>
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

.plans-hero {
  border-radius: 16px;
  background: linear-gradient(135deg, #0096fa 0%, #7c3aed 100%);
  padding: 2.2rem 2rem;
  color: #fff;
}

.plans-hero-inner {
  max-width: 600px;
}

.plans-hero-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
  margin: 0 0 0.4rem;
}

.plans-hero-title {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 0.5rem;
  color: inherit;
}

.plans-hero-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 0.9rem;
}

.plans-hero-stats {
  display: flex;
  gap: 0.5rem;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
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
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border-color: rgba(180, 35, 24, 0.16);
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 800;
  color: #172033;
  margin: 0 0 0.75rem;
}

.creators-row {
  display: flex;
  gap: 0.7rem;
  overflow-x: auto;
  padding-bottom: 0.3rem;
}

.creator-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  background: #fff;
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
  min-width: 200px;
  flex-shrink: 0;
}

.creator-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-chip-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.creator-chip-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
}

.creator-chip-count {
  font-size: 0.7rem;
  color: #64748b;
}

.follow-btn-sm {
  border: 1px solid #0096fa;
  border-radius: 999px;
  background: #fff;
  color: #0096fa;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  white-space: nowrap;
}

.follow-btn-sm.following {
  background: #0096fa;
  color: #fff;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.85rem;
}

.plans-grid--wide {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.plan-card {
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.plan-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.plan-creator-link {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 700;
  min-width: 0;
}

.plan-creator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.plan-creator-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-price {
  color: #0f766e;
  font-weight: 900;
  font-size: 0.88rem;
  white-space: nowrap;
}

.plan-title {
  font-size: 1rem;
  font-weight: 800;
  color: #172033;
  margin: 0;
}

.plan-strengths {
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.badge {
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-open {
  background: #dcfce7;
  color: #15803d;
}

.badge-accepting {
  background: #e0f2fe;
  color: #0369a1;
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.plan-tag {
  border-radius: 999px;
  background: #edf3fb;
  color: #334155;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.22rem 0.5rem;
}

.plan-tag.tag-active {
  background: #0096fa;
  color: #fff;
}

.plan-rules {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.5;
  margin: 0;
  border-top: 1px solid #edf0f4;
  padding-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-meta {
  color: #64748b;
  font-size: 0.75rem;
  margin: 0;
}

.plan-cta {
  display: inline-block;
  margin-top: 0.2rem;
  border: none;
  border-radius: 999px;
  background: #0096fa;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  text-decoration: none;
  text-align: center;
  align-self: flex-start;
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
  .plans-hero {
    padding: 1.4rem 1.2rem;
  }

  .plans-hero-title {
    font-size: 1.35rem;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .creator-chip {
    min-width: 170px;
  }
}
</style>
