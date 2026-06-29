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
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  tags: { type: Array, default: () => [] },
  variant: { type: String, default: 'link' },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['tag-click'])

const containerRef = ref(null)
const containerWidth = ref(0)

const AVG_TAG_WIDTH = 110
const TAG_GAP = 20

const maxVisibleTags = computed(() => {
  if (props.compact) return props.tags.length
  if (!containerWidth.value) return props.tags.length
  const available = containerWidth.value
  const count = Math.floor((available + TAG_GAP) / (AVG_TAG_WIDTH + TAG_GAP))
  return Math.max(1, Math.min(count, props.tags.length))
})

const visibleTags = computed(() => props.tags.slice(0, maxVisibleTags.value))
const hiddenCount = computed(() => props.tags.length - visibleTags.value)

function buildTagRoute(tag) {
  const normalized = (tag || '').toString().replace(/^#/, '').trim().toLowerCase()
  return `/tags/${encodeURIComponent(normalized)}`
}

let resizeObserver = null

onMounted(() => {
  if (!containerRef.value) return
  containerWidth.value = containerRef.value.offsetWidth
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      containerWidth.value = entry.contentRect.width
    }
  })
  resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="tag-strip" :class="{ compact }">
    <template v-if="variant === 'link'">
      <router-link
        v-for="tag in visibleTags"
        :key="tag"
        :to="buildTagRoute(tag)"
        class="tag-chip"
      >
        {{ tag }}
      </router-link>
    </template>
    <template v-else>
      <button
        v-for="tag in visibleTags"
        :key="tag"
        type="button"
        class="tag-chip"
        @click="emit('tag-click', tag.replace(/^#/, ''))"
      >
        {{ tag }}
      </button>
    </template>
    <span v-if="hiddenCount > 0" class="tag-overflow-hint">+{{ hiddenCount }}</span>
  </div>
</template>

<style scoped>
.tag-strip {
  display: flex;
  gap: 0.5rem;
  overflow: hidden;
  padding-bottom: 0.2rem;
  flex-wrap: nowrap;
  align-items: center;
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
  flex-shrink: 0;
}

.tag-strip.compact .tag-chip {
  font-size: 0.76rem;
  padding: 0.42rem 0.76rem;
}

.tag-chip:hover {
  filter: brightness(1.06);
}

.tag-overflow-hint {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0 0.25rem;
}

.tag-chip:nth-child(6n + 1) { background: #79a65a; }
.tag-chip:nth-child(6n + 2) { background: #b07ba4; }
.tag-chip:nth-child(6n + 3) { background: #5f88cc; }
.tag-chip:nth-child(6n + 4) { background: #d87a6e; }
.tag-chip:nth-child(6n + 5) { background: #7b78cf; }
.tag-chip:nth-child(6n + 6) { background: #5f9db0; }
</style>
