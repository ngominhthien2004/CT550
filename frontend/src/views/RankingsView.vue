<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useFeedStore } from '../stores/feed.store'

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const route = useRoute()
const router = useRouter()
const feedStore = useFeedStore()
const isNavCollapsed = ref(true)
const period = ref('daily')

const topThree = computed(() => feedStore.rankings.slice(0, 3))
const rankingList = computed(() => feedStore.rankings.slice(3))

const periodLabel = computed(() => {
  const found = PERIOD_OPTIONS.find((item) => item.value === period.value)
  return found?.label || 'Daily'
})

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadRankings() {
  await feedStore.fetchRankings(period.value)
}

async function updatePeriod(nextPeriod) {
  const safePeriod = PERIOD_OPTIONS.some((item) => item.value === nextPeriod) ? nextPeriod : 'daily'
  if (safePeriod === period.value) {
    return
  }

  period.value = safePeriod
  await router.replace({
    path: '/rankings',
    query: { period: safePeriod },
  })
}

function pickCover(item) {
  return item?.images?.[0] || ''
}

function normalizePeriodFromRoute() {
  const queryPeriod = typeof route.query.period === 'string' ? route.query.period : 'daily'
  period.value = PERIOD_OPTIONS.some((item) => item.value === queryPeriod) ? queryPeriod : 'daily'
}

onMounted(async () => {
  normalizePeriodFromRoute()
  await loadRankings()
})

watch(
  () => route.query.period,
  async () => {
    const before = period.value
    normalizePeriodFromRoute()
    if (before !== period.value) {
      await loadRankings()
    }
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="ranking-page page-block">
      <header class="ranking-hero">
        <div>
          <p class="hero-kicker mb-1">IlluWrl Global Ranking</p>
          <h1 class="mb-2">{{ periodLabel }} Top Works</h1>
          <p class="hero-sub mb-0">Updated from likes, bookmarks, and active discovery signals.</p>
        </div>
        <div class="hero-tabs" role="tablist" aria-label="Ranking period tabs">
          <button
            v-for="item in PERIOD_OPTIONS"
            :key="item.value"
            type="button"
            class="hero-tab"
            :class="{ active: item.value === period }"
            role="tab"
            :aria-selected="item.value === period"
            @click="updatePeriod(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </header>

      <p v-if="feedStore.loading" class="state-note">Loading rankings...</p>
      <p v-else-if="feedStore.error" class="state-note error">{{ feedStore.error }}</p>

      <template v-else>
        <section v-if="topThree.length" class="podium-grid" aria-label="Top 3 artworks">
          <article v-for="(item, index) in topThree" :key="item._id" class="podium-card">
            <span class="podium-rank">#{{ index + 1 }}</span>
            <router-link :to="`/artworks/${item._id}`" class="podium-cover-link">
              <img :src="pickCover(item)" :alt="item.title" loading="lazy" />
            </router-link>
            <router-link :to="`/artworks/${item._id}`" class="podium-title">{{ item.title }}</router-link>
            <p class="podium-meta mb-0">
              {{ item.user?.displayName || item.user?.username || 'Unknown artist' }}
            </p>
            <p class="podium-score mb-0">
              <i class="fa-regular fa-heart" aria-hidden="true"></i>
              {{ item.likeCount || 0 }}
            </p>
          </article>
        </section>

        <section v-if="rankingList.length" class="ranking-list" aria-label="Ranking list">
          <article v-for="(item, index) in rankingList" :key="item._id" class="rank-row">
            <span class="rank-index">{{ index + 4 }}</span>
            <router-link :to="`/artworks/${item._id}`" class="row-cover-link">
              <img :src="pickCover(item)" :alt="item.title" loading="lazy" />
            </router-link>
            <div class="row-body">
              <router-link :to="`/artworks/${item._id}`" class="row-title">{{ item.title }}</router-link>
              <p class="row-meta mb-0">{{ item.user?.displayName || item.user?.username || 'Unknown artist' }}</p>
            </div>
            <span class="row-score">{{ item.likeCount || 0 }} likes</span>
          </article>
        </section>

        <p v-if="!feedStore.rankings.length" class="state-note">No ranking data available yet.</p>
      </template>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.ranking-page {
  max-width: 1060px;
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.ranking-hero {
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 48%, #fff1f2 100%);
  border-radius: 20px;
  padding: 1rem 1.15rem;
  display: grid;
  gap: 0.9rem;
}

.hero-kicker {
  color: #0369a1;
  font-size: 0.79rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.ranking-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: 2rem;
}

.hero-sub {
  color: #334155;
  font-size: 0.92rem;
}

.hero-tabs {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.hero-tab {
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #fff;
  color: #1d4ed8;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0.35rem 0.88rem;
}

.hero-tab.active {
  color: #fff;
  border-color: #1d4ed8;
  background: #1d4ed8;
}

.state-note {
  margin: 0;
  color: #64748b;
}

.state-note.error {
  color: #dc2626;
}

.podium-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.podium-card {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 14px;
  padding: 0.7rem;
  display: grid;
  gap: 0.4rem;
}

.podium-rank {
  font-size: 0.8rem;
  font-weight: 800;
  color: #b45309;
}

.podium-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  object-fit: cover;
  background: #f1f5f9;
}

.podium-title {
  text-decoration: none;
  color: #111827;
  font-weight: 700;
  line-height: 1.25;
}

.podium-meta {
  color: #64748b;
  font-size: 0.8rem;
}

.podium-score {
  color: #be123c;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
}

.ranking-list {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
}

.rank-row {
  display: grid;
  grid-template-columns: 42px 88px 1fr auto;
  gap: 0.65rem;
  align-items: center;
  padding: 0.65rem 0.8rem;
  border-bottom: 1px solid #f1f5f9;
}

.rank-row:last-child {
  border-bottom: none;
}

.rank-index {
  color: #334155;
  font-size: 0.86rem;
  font-weight: 700;
}

.rank-row img {
  width: 88px;
  height: 58px;
  border-radius: 8px;
  object-fit: cover;
  background: #f8fafc;
}

.row-title {
  text-decoration: none;
  color: #0f172a;
  font-weight: 700;
}

.row-meta {
  font-size: 0.78rem;
  color: #64748b;
}

.row-score {
  color: #be123c;
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .podium-grid {
    grid-template-columns: 1fr;
  }

  .rank-row {
    grid-template-columns: 36px 78px 1fr;
  }

  .row-score {
    grid-column: 2 / 4;
  }
}
</style>
