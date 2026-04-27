<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabItems = [
  { key: 'home', label: 'Home', to: { path: '/' } },
  { key: 'illust', label: 'Illustrations', to: { path: '/illustrations' } },
  { key: 'manga', label: 'Manga', to: { path: '/manga' } },
  { key: 'novel', label: 'Novels', to: { path: '/novels' } },
]

const activeTab = computed(() => {
  if (route.path === '/illustrations') return 'illust'
  if (route.path === '/manga') return 'manga'
  if (route.path === '/novels') return 'novel'

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
