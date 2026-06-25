<script setup>
/**
 * TagStrip — Reusable tag chip strip.
 *
 * Props:
 *   tags    - Array of tag strings to display (display-ready, e.g. "#tagname")
 *   variant - 'link' (router-link → /tags/:name) or 'button' (emits tag-click)
 *   compact - compact mode (wrap instead of scroll, smaller padding/font)
 *
 * Events (button variant only):
 *   tag-click(tag) - emitted with the raw tag string (as passed in `tags`)
 */
defineProps({
  tags: { type: Array, default: () => [] },
  variant: { type: String, default: 'link' },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['tag-click'])

function buildTagRoute(tag) {
  const normalized = (tag || '').toString().replace(/^#/, '').trim().toLowerCase()
  return `/tags/${encodeURIComponent(normalized)}`
}
</script>

<template>
  <div class="tag-strip" :class="{ compact }">
    <template v-if="variant === 'link'">
      <router-link
        v-for="tag in tags"
        :key="tag"
        :to="buildTagRoute(tag)"
        class="tag-chip"
      >
        {{ tag }}
      </router-link>
    </template>
    <template v-else>
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        class="tag-chip"
        @click="emit('tag-click', tag.replace(/^#/, ''))"
      >
        {{ tag }}
      </button>
    </template>
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

.tag-strip.compact {
  flex-wrap: wrap;
  overflow: visible;
}

.tag-chip {
  text-decoration: none;
  display: inline-block;
  border: none;
  white-space: nowrap;
  color: #fff;
  border-radius: 999px;
  padding: 0.58rem 0.92rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.tag-strip.compact .tag-chip {
  font-size: 0.76rem;
  padding: 0.42rem 0.76rem;
}

.tag-chip:hover {
  filter: brightness(1.06);
}

.tag-chip:nth-child(6n + 1) { background: #79a65a; }
.tag-chip:nth-child(6n + 2) { background: #b07ba4; }
.tag-chip:nth-child(6n + 3) { background: #5f88cc; }
.tag-chip:nth-child(6n + 4) { background: #d87a6e; }
.tag-chip:nth-child(6n + 5) { background: #7b78cf; }
.tag-chip:nth-child(6n + 6) { background: #5f9db0; }
</style>
