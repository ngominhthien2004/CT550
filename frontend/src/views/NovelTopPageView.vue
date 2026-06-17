<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { NovelSection, NovelCreators } from '@/components/novel'
import { HomeTabs, HomeHeroBanner, HomeTagStrip } from '@/components/home'

import { getArtworks } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useFollowStore } from '../stores/follow.store'
import heroImage from '../assets/hero.png'

const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const isNavCollapsed = ref(true)
const loading = ref(false)
const loadError = ref('')
const novelItems = ref([])
const liveTags = ref([])
const authStore = useAuthStore()
const followStore = useFollowStore()
const router = useRouter()

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function clipText(text, limit = 160) {
  const cleanText = String(text || '').replace(/\s+/g, ' ').trim()
  if (!cleanText) {
    return 'No synopsis has been added for this novel yet.'
  }

  if (cleanText.length <= limit) {
    return cleanText
  }

  return `${cleanText.slice(0, limit).trimEnd()}...`
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  try {
    return new Date(value).toLocaleDateString()
  } catch (_error) {
    return ''
  }
}

function buildNovelImage(item) {
  if (item?.image) {
    return item.image
  }

  if (Array.isArray(item?.images) && item.images.length > 0) {
    return item.images[0] || ''
  }

  return ''
}

function normalizeNovel(item) {
  const author = item?.user || {}

  return {
    ...item,
    image: buildNovelImage(item),
    authorName: author.displayName || author.username || 'Unknown writer',
    authorAvatar: author.avatar || DEFAULT_AVATAR,
    excerpt: clipText(item?.description || item?.novelContent || '', 168),
    userId: author._id || '',
    wordCount: toNumber(item?.wordCount),
    chapterCount: toNumber(item?.chapterCount) || (item?.novelFormat === 'series' ? 1 : 0),
    createdLabel: formatDate(item?.createdAt),
    engagementScore:
      toNumber(item?.viewCount) + toNumber(item?.likeCount) * 4 + toNumber(item?.bookmarkCount) * 5 + toNumber(item?.chapterCount) * 12,
  }
}

const normalizedNovels = computed(() =>
  novelItems.value
    .map(normalizeNovel)
    .filter((item) => item._id && item.type === 'novel'),
)

const featuredNovel = computed(() => {
  const withCover = normalizedNovels.value.filter((item) => item.image)
  const source = withCover.length ? withCover : normalizedNovels.value

  return [...source].sort((a, b) => b.engagementScore - a.engagementScore)[0] || null
})

const tagChips = computed(() => {
  const bucket = new Map()

  normalizedNovels.value.forEach((item) => {
    ;(item.tags || []).forEach((tag) => {
      const label = String(tag?.name || '').trim()
      if (!label) {
        return
      }

      const key = label.toLowerCase()
      const entry = bucket.get(key) || { label, count: 0 }
      entry.count += 1
      bucket.set(key, entry)
    })
  })

  return Array.from(bucket.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 16)
})

function sortByEngagement(items) {
  return [...items].sort((a, b) => b.engagementScore - a.engagementScore || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

function sortByNewest(items) {
  return [...items].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

const popularOriginalNovels = computed(() =>
  sortByEngagement(normalizedNovels.value.filter((item) => item.novelFormat !== 'series')).slice(0, 6),
)

const recommendedWorks = computed(() =>
  sortByEngagement(normalizedNovels.value.filter((item) => item._id !== featuredNovel.value?._id)).slice(0, 6),
)

const seriesHighlights = computed(() =>
  sortByEngagement(normalizedNovels.value.filter((item) => item.novelFormat === 'series')).slice(0, 6),
)

const freshPicks = computed(() => sortByNewest(normalizedNovels.value).slice(0, 6))

const creatorRows = computed(() => {
  const creatorMap = new Map()

  normalizedNovels.value.forEach((item) => {
    const author = item.user || {}
    if (!author?._id) {
      return
    }

    if (authStore.user?._id && author._id === authStore.user._id) {
      return
    }

    const current = creatorMap.get(author._id) || {
      _id: author._id,
      username: author.username || '',
      displayName: author.displayName || author.username || 'Unknown writer',
      avatar: author.avatar || DEFAULT_AVATAR,
      workCount: 0,
      totalViews: 0,
    }

    current.workCount += 1
    current.totalViews += toNumber(item.viewCount)
    creatorMap.set(author._id, current)
  })

  return Array.from(creatorMap.values())
    .sort((a, b) => b.workCount - a.workCount || b.totalViews - a.totalViews)
    .slice(0, 6)
})

const heroSlide = computed(() => ({
  title: featuredNovel.value?.title || 'Explore the novel top page',
  image: featuredNovel.value?.image || heroImage,
}))

const heroKicker = computed(() => (featuredNovel.value ? 'Featured novel' : 'Novels'))

const heroDescription = computed(() => {
  if (!featuredNovel.value) {
    return 'A dedicated editorial landing page for novels, stories, and long-form reading.'
  }

  const text = String(featuredNovel.value?.excerpt || featuredNovel.value?.description || featuredNovel.value?.novelContent || '')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > 220 ? `${text.slice(0, 220).trimEnd()}...` : text
})

const heroPrimaryLink = computed(() => (featuredNovel.value?._id ? `/novels/${featuredNovel.value._id}` : '/search?type=novel'))

const heroSecondaryLink = '/search?type=novel&order=popular'

const heroNovelStats = computed(() => [
  { label: 'Views', value: Number(featuredNovel.value?.viewCount || 0).toLocaleString() },
  { label: 'Likes', value: Number(featuredNovel.value?.likeCount || 0).toLocaleString() },
  { label: 'Bookmarks', value: Number(featuredNovel.value?.bookmarkCount || 0).toLocaleString() },
])

const sectionTabs = computed(() => [
  { id: 'top', label: 'Top', href: '#top' },
  { id: 'popular-original', label: 'Popular original novels', href: '#popular-original' },
  { id: 'recommended-works', label: 'Recommended works', href: '#recommended-works' },
  { id: 'series-highlights', label: 'Series highlights', href: '#series-highlights' },
  { id: 'fresh-picks', label: 'Fresh picks', href: '#fresh-picks' },
  { id: 'creators', label: 'Creators', href: '#creators' },
])

const editorialSections = computed(() => [
  {
    id: 'popular-original',
    title: 'Popular original novels',
    subtitle: 'High-engagement one-shot and original story posts surfaced from the current novel catalog.',
    linkTo: { path: '/search', query: { type: 'novel', order: 'popular' } },
    items: popularOriginalNovels.value,
    emptyText: 'No original novel posts are available yet.',
  },
  {
    id: 'recommended-works',
    title: 'Recommended works',
    subtitle: 'A broader mix of recent novels with strong engagement and active readership.',
    linkTo: { path: '/search', query: { type: 'novel', order: 'newest' } },
    items: recommendedWorks.value,
    emptyText: 'No recommended novels are available yet.',
  },
  {
    id: 'series-highlights',
    title: 'Series highlights',
    subtitle: 'Longer-running novels and chapter-based stories with a more editorial feel.',
    linkTo: { path: '/search', query: { type: 'novel', order: 'popular' } },
    items: seriesHighlights.value,
    emptyText: 'No series novels are available yet.',
  },
  {
    id: 'fresh-picks',
    title: 'Fresh picks',
    subtitle: 'The newest novel posts currently available in the app.',
    linkTo: { path: '/search', query: { type: 'novel', order: 'newest' } },
    items: freshPicks.value,
    emptyText: 'No fresh novel posts are available yet.',
  },
])

async function loadNovelTopPage() {
  loading.value = true
  loadError.value = ''

  try {
    const { data } = await getArtworks({ limit: 96, type: 'novel' })
    const source = Array.isArray(data) ? data : []
    novelItems.value = source.filter((item) => item?.type === 'novel')

    liveTags.value = tagChips.value.map((tag) => `#${tag.label}`)

    if (authStore.isAuthenticated && creatorRows.value.length) {
      await Promise.all(
        creatorRows.value.map((creator) => followStore.fetchFollowStatus(creator._id).catch(() => null)),
      )
    }
  } catch (_error) {
    novelItems.value = []
    liveTags.value = []
    loadError.value = 'Failed to load novel top page.'
  } finally {
    loading.value = false
  }
}

async function handleToggleFollow(userId) {
  if (!userId) {
    return
  }

  if (!authStore.isAuthenticated) {
    await router.push({ path: '/login', query: { redirect: '/novels' } })
    return
  }

  await followStore.toggleFollowByUser(userId)
}

onMounted(loadNovelTopPage)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="novel-top-page">
      <HomeTabs />
      <HomeTagStrip :tags="liveTags" compact />

      <HomeHeroBanner
        :slide="heroSlide"
        :kicker-text="heroKicker"
        :description="heroDescription"
        :primary-link="heroPrimaryLink"
        primary-label="Read now"
        :secondary-link="heroSecondaryLink"
        secondary-label="Browse novels"
        :show-novel-stats="!!featuredNovel"
        :novel-stats="heroNovelStats"
      />

      <p v-if="loadError" class="novel-page-state novel-page-state--error">{{ loadError }}</p>
      <p v-else-if="loading && !normalizedNovels.length" class="novel-page-state">Loading novels...</p>

      <section v-else class="novel-editorial-stack">
        <NovelSection
          v-for="section in editorialSections"
          :key="section.id"
          :section-id="section.id"
          :title="section.title"
          :subtitle="section.subtitle"
          :link-to="section.linkTo"
          :items="section.items"
          :empty-text="section.emptyText"
        />
      </section>

      <NovelCreators
        v-if="creatorRows.length"
        :creators="creatorRows"
        :is-authenticated="authStore.isAuthenticated"
        :is-following-user="followStore.isFollowingUser"
        :is-toggling-follow="followStore.isTogglingFollow"
        @toggle-follow="handleToggleFollow"
      />
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.novel-top-page {
  display: block;
  padding: 0.4rem 0;
}

.novel-top-page > :deep(*:not(:last-child)) {
  margin-bottom: 0.85rem;
}

.novel-page-state {
  margin: 0;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--muted);
  font-weight: 600;
}

.novel-page-state--error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border-color: rgba(180, 35, 24, 0.16);
}

.novel-editorial-stack {
  display: grid;
  gap: 0.9rem;
}
</style>
