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
      <strong class="me-3">
        <router-link
          v-if="bookmark.artwork?._id"
          class="text-decoration-none"
          :to="`/artworks/${bookmark.artwork._id}`"
        >
          {{ bookmark.artwork?.title || 'Untitled artwork' }}
        </router-link>
        <span v-else>{{ bookmark.artwork?.title || 'Untitled artwork' }}</span>
      </strong>
      <span class="text-secondary small">{{ bookmark.folder || 'default' }}</span>
    </li>
  </ul>
</template>
