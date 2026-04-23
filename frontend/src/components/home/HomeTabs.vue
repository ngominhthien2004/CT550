<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeTab = computed(() => {
  if (route.path === '/illustrations') return 'illust'
  if (route.path === '/manga') return 'manga'
  if (route.path === '/novels') return 'novel'

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
    <router-link to="/" :class="{ active: activeTab === 'home' }">Home</router-link>
    <router-link to="/illustrations" :class="{ active: activeTab === 'illust' }">Illustrations</router-link>
    <router-link to="/manga" :class="{ active: activeTab === 'manga' }">Manga</router-link>
    <router-link to="/novels" :class="{ active: activeTab === 'novel' }">Novels</router-link>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 1.9rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0;
}

.tabs a {
  text-decoration: none;
  color: #64748b;
  font-weight: 700;
  padding: 0.55rem 0.1rem 0.7rem;
  font-size: 0.95rem;
}

.tabs .active {
  color: #0f172a;
  border-bottom: 4px solid #1695f0;
}

@media (max-width: 920px) {
  .tabs {
    gap: 1rem;
    overflow-x: auto;
  }

  .tabs a {
    font-size: 0.9rem;
  }
}
</style>
