<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()

const activeId = computed(() => {
  if (route.hash) {
    return route.hash.replace('#', '')
  }

  return props.tabs[0]?.id || 'top'
})
</script>

<template>
  <nav class="novel-top-tabs" aria-label="Novel top page sections">
    <a
      v-for="tab in tabs"
      :key="tab.id"
      :href="tab.href"
      class="novel-top-tab"
      :class="{ active: activeId === tab.id }"
    >
      {{ tab.label }}
    </a>
  </nav>
</template>

<style scoped>
.novel-top-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.08rem 0 0.26rem;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}

.novel-top-tab {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0.64rem 0.88rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 0.88rem;
  white-space: nowrap;
}

.novel-top-tab.active {
  color: var(--brand);
  border-color: rgba(22, 149, 240, 0.18);
  background: rgba(22, 149, 240, 0.08);
}

@media (max-width: 920px) {
  .novel-top-tab {
    padding: 0.58rem 0.8rem;
    font-size: 0.84rem;
  }
}
</style>
