<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="tag-strip">
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </div>
</template>

<style scoped>
.tag-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.tag-strip span {
  white-space: nowrap;
  padding: 0.56rem 1rem;
  border-radius: 6px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
}

.tag-strip span:nth-child(6n + 1) {
  background: #79a65a;
}

.tag-strip span:nth-child(6n + 2) {
  background: #b07ba4;
}

.tag-strip span:nth-child(6n + 3) {
  background: #5f88cc;
}

.tag-strip span:nth-child(6n + 4) {
  background: #d87a6e;
}

.tag-strip span:nth-child(6n + 5) {
  background: #7b78cf;
}

.tag-strip span:nth-child(6n + 6) {
  background: #5f9db0;
}
</style>
