<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
})

function buildTagRoute(tag) {
  const normalizedTag = (tag || '').toString().replace(/^#/, '').trim().toLowerCase()
  return `/tags/${encodeURIComponent(normalizedTag)}`
}
</script>

<template>
  <div class="tag-strip">
    <router-link v-for="tag in tags" :key="tag" :to="buildTagRoute(tag)" class="tag-link">
      {{ tag }}
    </router-link>
  </div>
</template>

<style scoped>
.tag-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.tag-link {
  text-decoration: none;
  display: inline-block;
  white-space: nowrap;
  padding: 0.56rem 1rem;
  border-radius: 6px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
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
