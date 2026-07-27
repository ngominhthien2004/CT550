<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { translateError } from '../utils/translateError.js'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { HomeArtworkGrid, HomeFeedColumn } from '@/components/home'
import NovelCard from '@/components/novel/NovelCard.vue'
import { getFeed } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useLikeStore } from '../stores/like.store'
import { buildTypeTabs, filterByType } from '@/utils/typeTabs.js'

const { t } = useI18n()
const isNavCollapsed = ref(true)
const liveWorks = ref([])
const loading = ref(false)
const error = ref('')
const authStore = useAuthStore()
const likeStore = useLikeStore()

const activeType = ref('')

const normalizedWorks = computed(() =>
  liveWorks.value.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

const typeTabs = computed(() =>
  buildTypeTabs(normalizedWorks.value, (item) => String(item.type || '').toLowerCase()),
)

const filteredWorks = computed(() =>
  filterByType(normalizedWorks.value, activeType.value, (item) => String(item.type || '').toLowerCase()),
)

const artworks = computed(() =>
  filteredWorks.value.filter((item) => String(item.type || '').toLowerCase() !== 'novel'),
)

const novels = computed(() =>
  filteredWorks.value.filter((item) => String(item.type || '').toLowerCase() === 'novel'),
)

const normalizedNovels = computed(() =>
  novels.value.map((item) => ({
    ...item,
    userId: item.user?._id,
    authorName: item.user?.displayName || item.user?.username || 'Unknown',
    authorAvatar: item.user?.avatar || 'https://s.pximg.net/common/images/no_profile.png',
    createdLabel: '',
  })),
)

const spotlightWorks = computed(() => artworks.value.slice(0, 12))
const feedWorks = computed(() => artworks.value.slice(12))

function selectType(type) {
  activeType.value = type
}

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
    error.value = translateError(err, t)
    liveWorks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFollowingWorks()
  if (authStore.isAuthenticated) {
    likeStore.fetchMyLikes({ limit: 120 })
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="following-page">
      <div class="following-main">
          <!-- Type filter tabs (pills) -->
          <div v-if="typeTabs.length" class="type-tabs" role="tablist" aria-label="Type filter tabs">
            <button
              type="button"
              class="type-tab"
              :class="{ active: activeType === '' }"
              role="tab"
              :aria-selected="activeType === ''"
              @click="selectType('')"
            >
              {{ $t('common.all') }} <span class="type-count">{{ normalizedWorks.length }}</span>
            </button>
            <button
              v-for="tab in typeTabs"
              :key="tab.value"
              type="button"
              class="type-tab"
              :class="{ active: tab.value === activeType }"
              role="tab"
              :aria-selected="tab.value === activeType"
              @click="selectType(tab.value)"
            >
              {{ tab.label }} <span class="type-count">{{ tab.count }}</span>
            </button>
          </div>

          <HomeArtworkGrid v-if="activeType !== 'novel'" :works="spotlightWorks" title-key="home.worksByFollowing" :show-view-all="false" />

          <p v-if="loading && liveWorks.length === 0" class="state-note">{{ $t('common.loading') }}...</p>
          <p v-else-if="error" class="state-note error">{{ error }}</p>
          <p v-else-if="!loading && liveWorks.length === 0 && activeType !== 'novel'" class="state-note">
            {{ $t('home.noWorksFollowed') }}
          </p>

        <!-- Novels section (only when Novel tab is active) -->
        <section v-if="activeType === 'novel' && normalizedNovels.length" class="novel-following-section">
          <header class="section-head">
            <div>
              <h3>{{ $t('home.novelsByFollowing') }}</h3>
            </div>
          </header>
          <div class="novel-following-list">
            <NovelCard v-for="novel in normalizedNovels" :key="novel._id" :item="novel" />
          </div>
        </section>

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
  font-size: 1.6rem;
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

.type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-tab {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.42rem 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

.type-tab.active {
  border-color: var(--accent-line, #93c5fd);
  color: var(--accent, #0369a1);
  background: var(--accent-bg, #e0f2fe);
}

.type-count {
  font-size: 0.72rem;
  color: var(--muted);
}

.novel-following-section {
  display: grid;
  gap: 0.9rem;
}

.novel-following-section .section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.8rem;
}

.novel-following-section .section-head h3 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
}

.novel-following-list {
  display: grid;
  gap: 0.8rem;
}
</style>
