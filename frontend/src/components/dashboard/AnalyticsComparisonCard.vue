<template>
  <article class="comparison-card dash-card">
    <div class="card-header-row">
      <span class="metric-label">
        <i :class="icon" :style="{ color }"></i>
        {{ label }}
      </span>
      <span v-if="loading" class="spinner-border spinner-border-sm text-muted"></span>
    </div>
    <div class="card-value-row">
      <strong class="metric-value">{{ formattedCurrent }}</strong>
      <span v-if="changePercent !== null" :class="['change-badge', changePercent >= 0 ? 'positive' : 'negative']">
        <i :class="changePercent >= 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
        {{ Math.abs(changePercent) }}%
      </span>
    </div>
    <small class="text-muted">
      Total: {{ formattedTotal }} &middot; Prev: {{ formattedPrevious }}
    </small>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: 'fa-solid fa-chart-simple' },
  color: { type: String, default: 'var(--indigo, #6366f1)' },
  current: { type: Number, default: 0 },
  previous: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  changePercent: { type: Number, default: null },
  loading: { type: Boolean, default: false },
})

const formattedCurrent = computed(() => props.current.toLocaleString())
const formattedPrevious = computed(() => props.previous.toLocaleString())
const formattedTotal = computed(() => props.total.toLocaleString())
</script>

<style scoped>
.comparison-card {
  background: var(--surface, #fff);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 14px;
  padding: 1rem;
}
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.metric-label {
  font-size: 0.85rem;
  color: var(--muted, #64748b);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text, #0f172a);
}
.card-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.change-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}
.change-badge.positive {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.1);
}
.change-badge.negative {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}
.text-muted {
  font-size: 0.75rem;
}
</style>
