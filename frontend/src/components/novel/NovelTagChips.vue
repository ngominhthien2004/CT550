<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
})

const processedTags = computed(() =>
  props.tags.map(tag => ({
    ...tag,
    _link: {
      path: '/search',
      query: { type: 'novel', q: tag.label.replace(/^#/, '') },
    },
  }))
)
</script>

<template>
  <section class="novel-tag-strip" aria-label="Novel tag chips">
    <router-link
      v-for="tag in processedTags"
      :key="tag.label"
      :to="tag._link"
      class="novel-tag-chip"
    >
      <span>{{ tag.label }}</span>
      <small>{{ tag.count }}</small>
    </router-link>
  </section>
</template>

<style scoped>
.novel-tag-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.novel-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.52rem 0.8rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--text);
  background: linear-gradient(135deg, rgba(22, 149, 240, 0.1), rgba(148, 185, 109, 0.14));
  border: 1px solid rgba(22, 149, 240, 0.12);
  font-weight: 700;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.novel-tag-chip small {
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.novel-tag-chip:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
</style>
