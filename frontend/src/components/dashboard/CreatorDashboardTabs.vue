<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, default: 'home' }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const tabs = [
  { key: 'home', label: t('profile.tabHome') },
  { key: 'works', label: t('dashboard.tabWorks') },
  { key: 'reactions', label: t('dashboard.tabReactions') },
]

function selectTab(key) {
  emit('update:modelValue', key)
}
</script>

<template>
  <nav class="dashboard-tabs" :aria-label="$t('dashboard.title')">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="dashboard-tab"
      :class="{ 'dashboard-tab--active': tab.key === modelValue }"
      @click="selectTab(tab.key)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<style scoped>
.dashboard-tabs {
  display: flex;
  gap: 1.35rem;
  border-bottom: 1px solid var(--line);
  width: 100%;
  overflow-x: auto;
}

.dashboard-tab {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.78rem 0.1rem 0.9rem;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.dashboard-tab:hover {
  color: var(--text);
}

.dashboard-tab--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

@media (max-width: 920px) {
  .dashboard-tab {
    font-size: 0.86rem;
    padding-bottom: 0.8rem;
  }
}
</style>
