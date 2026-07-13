import { ref, computed, reactive } from 'vue'
import { analyticsApi } from '@/services/api.js'

/**
 * Composable for fetching and transforming creator analytics data.
 * Provides reactive state and chart-ready data.
 */
export function useDashboardAnalytics() {
  // ── State ──
  const overview = ref(null)
  const trends = ref(null)
  const breakdown = ref(null)
  const followerGrowth = ref(null)
  const artworkAnalytics = ref(null)
  const loading = reactive({ overview: false, trends: false, breakdown: false, followerGrowth: false, artworkAnalytics: false })
  const error = ref(null)
  const period = ref('30d')
  const trendType = ref('views')

  // ── Actions ──
  async function loadOverview() {
    loading.overview = true
    error.value = null
    try {
      const { data } = await analyticsApi.getOverview({ period: period.value })
      overview.value = data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load overview stats'
    } finally {
      loading.overview = false
    }
  }

  async function loadTrends(type) {
    if (type) trendType.value = type
    loading.trends = true
    error.value = null
    try {
      const { data } = await analyticsApi.getTrends({ period: period.value, type: trendType.value })
      trends.value = data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load trends'
    } finally {
      loading.trends = false
    }
  }

  async function loadBreakdown() {
    loading.breakdown = true
    error.value = null
    try {
      const { data } = await analyticsApi.getBreakdown({ period: period.value })
      breakdown.value = data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load breakdown'
    } finally {
      loading.breakdown = false
    }
  }

  async function loadFollowerGrowth() {
    loading.followerGrowth = true
    error.value = null
    try {
      const { data } = await analyticsApi.getFollowerGrowth({ period: period.value })
      followerGrowth.value = data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load follower growth'
    } finally {
      loading.followerGrowth = false
    }
  }

  async function loadAll() {
    await Promise.all([
      loadOverview(),
      loadTrends(),
      loadBreakdown(),
      loadFollowerGrowth(),
    ])
  }

  function setPeriod(newPeriod) {
    period.value = newPeriod
  }

  function setTrendType(type) {
    trendType.value = type
  }

  // ── Chart-ready computed data ──
  const trendChartData = computed(() => {
    if (!trends.value) return null
    const { labels, current, previous } = trends.value
    if (!labels || !current || !previous) return null

    return {
      labels,
      datasets: [
        {
          label: 'Current Period',
          data: current,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHitRadius: 10,
        },
        {
          label: 'Previous Period',
          data: previous,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.05)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHitRadius: 10,
        },
      ],
    }
  })

  const breakdownChartData = computed(() => {
    if (!breakdown.value?.items) return null
    const items = breakdown.value.items.slice(0, 10)
    return {
      labels: items.map(a => a.title?.substring(0, 30) || 'Untitled'),
      datasets: [
        {
          label: 'Views',
          data: items.map(a => a.views),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
        },
      ],
    }
  })

  const followerChartData = computed(() => {
    if (!followerGrowth.value) return null
    const { labels, current, previous } = followerGrowth.value
    if (!labels) return null

    return {
      labels,
      datasets: [
        {
          label: 'New Followers',
          data: current,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Previous Period',
          data: previous,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.05)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    }
  })

  const overviewStats = computed(() => {
    if (!overview.value) return null
    return [
      { key: 'views', label: 'Views', icon: 'fa-solid fa-eye', color: 'var(--indigo, #6366f1)', value: overview.value.views },
      { key: 'likes', label: 'Likes', icon: 'fa-solid fa-heart', color: 'var(--red, #ef4444)', value: overview.value.likes },
      { key: 'bookmarks', label: 'Bookmarks', icon: 'fa-solid fa-bookmark', color: 'var(--amber, #f59e0b)', value: overview.value.bookmarks },
      { key: 'comments', label: 'Comments', icon: 'fa-solid fa-comment', color: 'var(--emerald, #10b981)', value: overview.value.comments },
    ]
  })

  const trendTypeOptions = [
    { value: 'views', label: 'Views', icon: 'fa-solid fa-eye' },
    { value: 'likes', label: 'Likes', icon: 'fa-solid fa-heart' },
    { value: 'bookmarks', label: 'Bookmarks', icon: 'fa-solid fa-bookmark' },
    { value: 'comments', label: 'Comments', icon: 'fa-solid fa-comment' },
  ]

  const periodOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ]

  return {
    // State
    overview,
    trends,
    breakdown,
    followerGrowth,
    artworkAnalytics,
    loading,
    error,
    period,
    trendType,

    // Actions
    loadOverview,
    loadTrends,
    loadBreakdown,
    loadFollowerGrowth,
    loadAll,
    setPeriod,
    setTrendType,

    // Computed chart data
    trendChartData,
    breakdownChartData,
    followerChartData,
    overviewStats,

    // Options
    trendTypeOptions,
    periodOptions,
  }
}
