<template>
  <article class="chart-card dash-card">
    <div class="chart-header">
      <h5 class="chart-title">{{ title }}</h5>
      <div class="chart-total" v-if="currentTotal !== null">
        <strong>{{ currentTotal.toLocaleString() }}</strong>
        <span v-if="changePercent !== null" :class="['change-badge', changePercent >= 0 ? 'positive' : 'negative']">
          <i :class="changePercent >= 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
          {{ Math.abs(changePercent) }}%
        </span>
      </div>
    </div>
    <div class="chart-wrapper">
      <Line v-if="chartData" :data="chartData" :options="chartOptions" />
      <div v-else class="chart-empty">
        <i class="fa-solid fa-chart-line"></i>
        <span>No data available</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  title: { type: String, default: '' },
  chartData: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  currentTotal: { type: Number, default: null },
  changePercent: { type: Number, default: null },
  height: { type: Number, default: 200 },
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 12,
        font: { size: 11 },
        color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#64748b',
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      ticks: {
        maxTicksLimit: 10,
        font: { size: 10 },
        color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#64748b',
      },
      grid: { display: false },
    },
    y: {
      display: true,
      beginAtZero: true,
      ticks: {
        font: { size: 10 },
        color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#64748b',
      },
      grid: {
        color: 'rgba(0,0,0,0.06)',
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}))
</script>

<style scoped>
.chart-card {
  background: var(--surface, #fff);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 14px;
  padding: 1rem;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.chart-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text, #0f172a);
  margin: 0;
}
.chart-total {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}
.chart-total strong {
  font-size: 1rem;
}
.change-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.05rem 0.35rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}
.change-badge.positive { color: #16a34a; background: rgba(22, 163, 74, 0.1); }
.change-badge.negative { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
.chart-wrapper {
  position: relative;
  height: v-bind('height + "px"');
  width: 100%;
}
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted, #94a3b8);
  gap: 0.5rem;
  font-size: 0.85rem;
}
.chart-empty i { font-size: 2rem; }
</style>
