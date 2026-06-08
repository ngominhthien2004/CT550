<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
  tabs: {
    type: Array,
    default: () => [
      { id: 'users', label: 'User management' },
      { id: 'artworks', label: 'Artwork moderation' },
      { id: 'comments', label: 'Comment moderation' },
      { id: 'reports', label: 'Report review' },
      { id: 'tags', label: 'Tag management' },
    ],
  },
})

const emit = defineEmits(['change-tab'])
</script>

<template>
  <div class="admin-tabs" role="tablist" aria-label="Admin sections">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="admin-tab"
      :class="{ 'is-active': activeTab === tab.id }"
      :aria-selected="activeTab === tab.id"
      :aria-controls="`admin-panel-${tab.id}`"
      @click="emit('change-tab', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
