<template>
  <section class="analytics-panel">
    <!-- Period Selector -->
    <div class="analytics-controls">
      <div class="period-selector">
        <button
          v-for="opt in analytics.periodOptions"
          :key="opt.value"
          type="button"
          :class="['period-btn', { active: analytics.period.value === opt.value }]"
          @click="changePeriod(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
      <div v-if="analytics.loading.overview || analytics.loading.trends" class="loading-indicator">
        <span class="spinner-border spinner-border-sm"></span>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="analytics.error.value" class="alert alert-danger d-flex align-items-center gap-2">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>{{ analytics.error.value }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger ms-auto" @click="analytics.loadAll()">
        <i class="fa-solid fa-rotate"></i> Retry
      </button>
    </div>

    <!-- Overview Stats Cards -->
    <div class="stats-grid">
      <AnalyticsComparisonCard
        v-for="stat in analytics.overviewStats.value || []"
        :key="stat.key"
        :label="stat.label"
        :icon="stat.icon"
        :color="stat.color"
        :current="stat.value.current"
        :previous="stat.value.previous"
        :total="stat.value.total"
        :change-percent="stat.value.changePercent"
        :loading="analytics.loading.overview"
      />
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Trend Line Chart -->
      <div class="chart-card-wrapper">
        <div class="trend-type-selector">
          <button
            v-for="opt in analytics.trendTypeOptions"
            :key="opt.value"
            type="button"
            :class="['trend-type-btn', { active: analytics.trendType.value === opt.value }]"
            @click="changeTrendType(opt.value)"
          >
            <i :class="opt.icon"></i>
            {{ opt.label }}
          </button>
        </div>
        <AnalyticsLineChart
          :title="trendChartTitle"
          :chart-data="analytics.trendChartData.value"
          :loading="analytics.loading.trends"
          :current-total="analytics.trends.value?.currentTotal"
          :change-percent="analytics.trends.value?.changePercent"
        />
      </div>

      <!-- Follower Growth -->
      <AnalyticsLineChart
        title="Follower Growth"
        :chart-data="analytics.followerChartData.value"
        :loading="analytics.loading.followerGrowth"
        :current-total="analytics.followerGrowth.value?.totalFollowers"
        :change-percent="analytics.followerGrowth.value?.changePercent"
        :height="200"
      />
    </div>

    <!-- Top Artworks Breakdown -->
    <div class="breakdown-section">
      <AnalyticsBarChart
        title="Top Artworks"
        :chart-data="analytics.breakdownChartData.value"
        :loading="analytics.loading.breakdown"
        :sort="analytics.breakdown.value?.sort || 'views'"
        :sort-options="breakdownSortOptions"
        :height="300"
        @update:sort="changeBreakdownSort"
      />
    </div>
  </section>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useDashboardAnalytics } from '@/composables/useDashboardAnalytics.js'
import AnalyticsComparisonCard from './AnalyticsComparisonCard.vue'
import AnalyticsLineChart from './AnalyticsLineChart.vue'
import AnalyticsBarChart from './AnalyticsBarChart.vue'

const analytics = useDashboardAnalytics()

const trendChartTitle = computed(() => {
  const type = analytics.trendType.value
  const labels = {
    views: 'Views Over Time',
    likes: 'Likes Over Time',
    bookmarks: 'Bookmarks Over Time',
    comments: 'Comments Over Time',
  }
  return labels[type] || 'Trends'
})

const breakdownSortOptions = [
  { value: 'views', label: 'Views' },
  { value: 'likes', label: 'Likes' },
  { value: 'bookmarks', label: 'Bookmarks' },
  { value: 'comments', label: 'Comments' },
]

function changePeriod(period) {
  analytics.setPeriod(period)
  analytics.loadAll()
}

function changeTrendType(type) {
  analytics.loadTrends(type)
}

function changeBreakdownSort(sort) {
  analytics.loadBreakdown()
}

onMounted(() => {
  analytics.loadAll()
})
</script>

<style scoped>
.analytics-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.analytics-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.period-selector {
  display: flex;
  gap: 0.35rem;
  background: var(--surface, #fff);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 10px;
  padding: 0.25rem;
}

.period-btn {
  border: none;
  background: transparent;
  color: var(--muted, #64748b);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-btn:hover {
  color: var(--text, #0f172a);
  background: var(--bg, #f8fafc);
}

.period-btn.active {
  color: var(--surface, #fff);
  background: var(--accent, #6366f1);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--muted, #64748b);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.chart-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trend-type-selector {
  display: flex;
  gap: 0.25rem;
  background: var(--bg, #f8fafc);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 8px;
  padding: 0.2rem;
}

.trend-type-btn {
  border: none;
  background: transparent;
  color: var(--muted, #64748b);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.15s ease;
}

.trend-type-btn:hover {
  color: var(--text, #0f172a);
}

.trend-type-btn.active {
  color: var(--surface, #fff);
  background: var(--accent, #6366f1);
}

.breakdown-section {
  /* Full width section for bar chart */
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .analytics-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
