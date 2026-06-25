<script setup>
import TagStrip from '../shared/TagStrip.vue'

defineProps({
  tags: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <TagStrip :tags="tags" :compact="compact" variant="link" />
</template>
