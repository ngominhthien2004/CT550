<script setup>
const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'works', label: 'Works' },
  { key: 'reactions', label: 'Reactions' },
  { key: 'analytics', label: 'Access analytics', premium: true },
  { key: 'ranking', label: 'Ranking report', premium: true },
]
</script>

<template>
  <nav class="dashboard-tabs" aria-label="Creator dashboard tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="dashboard-tab"
      :class="{ 'dashboard-tab--active': tab.key === 'home' }"
    >
      {{ tab.label }}
      <span v-if="tab.premium" class="premium-chip" aria-hidden="true">P</span>
    </button>
  </nav>
</template>

<style scoped>
.dashboard-tabs {
  display: flex;
  gap: 0.42rem;
  flex-wrap: wrap;
}

.dashboard-tab {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 999px;
  height: 28px;
  padding: 0 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.dashboard-tab--active {
  color: #111827;
  background: #f1f5f9;
}


</style>
