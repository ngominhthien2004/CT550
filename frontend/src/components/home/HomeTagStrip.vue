<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

function buildTagRoute(tag) {
  const normalizedTag = (tag || '').toString().replace(/^#/, '').trim().toLowerCase()
  return `/tags/${encodeURIComponent(normalizedTag)}`
}

const processedTags = computed(() =>
  props.tags.map(t => ({ tag: t, route: buildTagRoute(t) }))
)
</script>

<template>
  <div class="tag-strip" :class="{ compact }">
    <router-link v-for="item in processedTags" :key="item.tag" :to="item.route" class="tag-link">
      {{ item.tag }}
    </router-link>
  </div>
</template>

<style scoped>
.tag-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  flex-wrap: nowrap;
}

.tag-link {
  text-decoration: none;
  display: inline-block;
  white-space: nowrap;
  padding: 0.58rem 0.92rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
}

.tag-strip.compact {
  flex-wrap: wrap;
  overflow: visible;
}

.tag-strip.compact .tag-link {
  font-size: 0.76rem;
  padding: 0.42rem 0.76rem;
}

.tag-link:nth-child(6n + 1) {
  background: #79a65a;
}

.tag-link:nth-child(6n + 2) {
  background: #b07ba4;
}

.tag-link:nth-child(6n + 3) {
  background: #5f88cc;
}

.tag-link:nth-child(6n + 4) {
  background: #d87a6e;
}

.tag-link:nth-child(6n + 5) {
  background: #7b78cf;
}

.tag-link:nth-child(6n + 6) {
  background: #5f9db0;
}

.tag-link:hover {
  filter: brightness(1.06);
}
</style>
