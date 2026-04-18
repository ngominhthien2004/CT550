<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useFeedStore } from '../stores/feed.store'

const TYPE_OPTIONS = [
  { value: 'all', label: 'Overall' },
  { value: 'illust', label: 'Illustrations' },
  { value: 'manga', label: 'Manga' },
  { value: 'novel', label: 'Novels' },
]

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'rookie', label: 'Rookie' },
]

const route = useRoute()
const router = useRouter()
const feedStore = useFeedStore()

const isNavCollapsed = ref(true)
const period = ref('daily')
const type = ref('all')

const rankings = computed(() => feedStore.rankings)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadRankings() {
  await feedStore.fetchRankings({ 
    period: period.value,
    type: type.value === 'all' ? undefined : type.value
  })
}

async function updateFilter(newPeriod, newType) {
  const p = newPeriod || period.value
  const t = newType || type.value
  
  if (p === period.value && t === type.value) return

  period.value = p
  type.value = t

  await router.replace({
    path: '/rankings',
    query: { period: p, type: t },
  })
}

function normalizeFromRoute() {
  const qPeriod = route.query.period || 'daily'
  const qType = route.query.type || 'all'
  
  period.value = PERIOD_OPTIONS.some(o => o.value === qPeriod) ? qPeriod : 'daily'
  type.value = TYPE_OPTIONS.some(o => o.value === qType) ? qType : 'all'
}

const formattedDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
})

onMounted(async () => {
  normalizeFromRoute()
  await loadRankings()
})

watch(() => [route.query.period, route.query.type], async () => {
  normalizeFromRoute()
  await loadRankings()
})

function pickCover(item) {
  return item?.images?.[0] || 'https://via.placeholder.com/200x200?text=No+Image'
}

function getRankClass(rank) {
  if (rank === 1) return 'rank-top-1'
  if (rank === 2) return 'rank-top-2'
  if (rank === 3) return 'rank-top-3'
  return ''
}
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <div class="rankings-container">
      <!-- Pixiv-style Header Tabs -->
      <nav class="type-tabs">
        <button 
          v-for="opt in TYPE_OPTIONS" 
          :key="opt.value"
          class="type-tab-btn"
          :class="{ active: type === opt.value }"
          @click="updateFilter(null, opt.value)"
        >
          {{ opt.label }}
        </button>
      </nav>

      <div class="period-bar">
        <div class="period-tabs">
          <button 
            v-for="opt in PERIOD_OPTIONS" 
            :key="opt.value"
            class="period-tab-btn"
            :class="{ active: period === opt.value }"
            @click="updateFilter(opt.value, null)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="date-indicator">
          {{ formattedDate }}
        </div>
      </div>

      <!-- Ranking Content -->
      <section class="ranking-content">
        <div v-if="feedStore.loading" class="loading-overlay">
          <div class="spinner"></div>
        </div>

        <div v-else-if="feedStore.error" class="error-msg">
          {{ feedStore.error }}
        </div>

        <div v-else-if="rankings.length === 0" class="empty-msg">
          No rankings found for this category.
        </div>

        <div v-else class="ranking-list">
          <article v-for="(item, index) in rankings" :key="item._id" class="ranking-item">
            <div class="rank-side">
              <span class="rank-number" :class="getRankClass(index + 1)">{{ index + 1 }}</span>
              <div class="rank-trend">
                <i class="fas fa-minus"></i>
              </div>
            </div>

            <router-link :to="`/artworks/${item._id}`" class="rank-image-link">
              <img :src="pickCover(item)" :alt="item.title" class="rank-thumb" />
            </router-link>

            <div class="rank-info">
              <h3 class="rank-title">
                <router-link :to="`/artworks/${item._id}`">{{ item.title }}</router-link>
              </h3>
              <div class="rank-author">
                <router-link :to="`/users/${item.user?._id}/profile`" class="author-link">
                  <img :src="item.user?.avatar || 'https://via.placeholder.com/24'" class="author-avatar" />
                  <span class="author-name">{{ item.user?.displayName || item.user?.username }}</span>
                </router-link>
              </div>
            </div>

            <div class="rank-actions">
              <div class="stat-item">
                <i class="fa-solid fa-heart"></i>
                <span>{{ item.likeCount || 0 }}</span>
              </div>
              <button class="bookmark-btn-round">
                <i class="fa-regular fa-bookmark"></i>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.rankings-container {
  padding: 0 72px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Type Tabs */
.type-tabs {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.type-tab-btn {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  color: #5c5c5c;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.type-tab-btn:hover {
  color: #0096fa;
}

.type-tab-btn.active {
  color: #0096fa;
}

.type-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #0096fa;
  border-radius: 3px 3px 0 0;
}

/* Period Bar */
.period-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 8px 0;
}

.period-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.period-tab-btn {
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-tab-btn:hover {
  color: #0f172a;
}

.period-tab-btn.active {
  background: #ffffff;
  color: #0096fa;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.date-indicator {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* List Items */
.ranking-content {
  margin-top: 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-height: 400px;
  position: relative;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item:hover {
  background: #fafafa;
}

.rank-side {
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.rank-number {
  font-size: 24px;
  font-weight: 900;
  color: #94a3b8;
}

.rank-top-1 { color: #facc15; font-size: 32px; }
.rank-top-2 { color: #94a3b8; font-size: 28px; }
.rank-top-3 { color: #d97706; font-size: 26px; }

.rank-trend {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

.rank-image-link {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  display: block;
}

.rank-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.rank-thumb:hover {
  transform: scale(1.05);
}

.rank-info {
  flex: 1;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.rank-title a {
  color: #1f2937;
  text-decoration: none;
}

.rank-title a:hover {
  text-decoration: underline;
}

.rank-author {
  display: flex;
  align-items: center;
}

.author-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #6b7280;
  font-size: 14px;
}

.author-link:hover .author-name {
  color: #0096fa;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.rank-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  width: 120px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ef4444;
  font-weight: 700;
  font-size: 15px;
}

.bookmark-btn-round {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-btn-round:hover {
  background: #f3f4f6;
  color: #3b82f6;
  border-color: #3b82f6;
}

.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .rankings-container {
    padding: 0 16px 40px;
  }
  .rank-image-link {
    width: 120px;
    height: 120px;
  }
  .ranking-item {
    padding: 16px;
  }
  .rank-info {
    padding: 0 12px;
  }
}
</style>
