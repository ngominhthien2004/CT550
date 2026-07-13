<template>
  <article class="chart-card dash-card">
    <div class="chart-header">
      <h5 class="chart-title">{{ title }}</h5>
      <div class="chart-header-controls">
        <select v-if="sortOptions" v-model="localSort" @change="$emit('update:sort', localSort)" class="sort-select">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
    <div class="chart-wrapper">
      <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
      <div v-else class="chart-empty">
        <i class="fa-solid fa-chart-bar"></i>
        <span>No data available</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  title: { type: String, default: '' },
  chartData: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  sort: { type: String, default: 'views' },
  sortOptions: { type: Array, default: null },
  height: { type: Number, default: 250 },
})

const emit = defineEmits(['update:sort'])

const localSort = ref(props.sort)
watch(() => props.sort, (val) => { localSort.value = val })

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x.toLocaleString()}`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { font: { size: 10 } },
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
    y: {
      ticks: { font: { size: 10 } },
      grid: { display: false },
    },
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
.sort-select {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 6px;
  background: var(--bg, #f8fafc);
  color: var(--text, #0f172a);
}
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
