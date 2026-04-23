<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabItems = [
  { key: 'home', label: 'Home', to: { path: '/' } },
  { key: 'illust', label: 'Illustrations', to: { path: '/feed', query: { type: 'illust' } } },
  { key: 'manga', label: 'Manga', to: { path: '/feed', query: { type: 'manga' } } },
  { key: 'novel', label: 'Novels', to: { path: '/feed', query: { type: 'novel' } } },
]

const activeTab = computed(() => {
  if (route.path === '/feed') {
    const type = typeof route.query.type === 'string' ? route.query.type : ''
    if (type === 'illust') return 'illust'
    if (type === 'manga') return 'manga'
    if (type === 'novel') return 'novel'
  }

  return 'home'
})
</script>

<template>
  <div class="tabs">
    <router-link
      v-for="item in tabItems"
      :key="item.key"
      :to="item.to"
      :class="{ active: activeTab === item.key }"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 1.35rem;
  padding: 0;
  border-bottom: 1px solid #e3e8ef;
  width: 100%;
  overflow-x: auto;
}

.tabs a {
  text-decoration: none;
  color: #64748b;
  font-weight: 700;
  padding: 0.78rem 0.1rem 0.9rem;
  font-size: 0.9rem;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.tabs .active {
  color: #0f172a;
  border-bottom-color: #0096fa;
}

@media (max-width: 920px) {
  .tabs a {
    font-size: 0.86rem;
    padding-bottom: 0.8rem;
  }
}
</style>
