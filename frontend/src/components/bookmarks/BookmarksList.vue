<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ul class="list-group">
    <li
      v-for="bookmark in items"
      :key="bookmark._id"
      class="list-group-item d-flex align-items-center justify-content-between py-3"
    >
      <strong class="me-3">{{ bookmark.artwork?.title || 'Untitled artwork' }}</strong>
      <span class="text-secondary small">{{ bookmark.folder || 'default' }}</span>
    </li>
  </ul>
</template>
