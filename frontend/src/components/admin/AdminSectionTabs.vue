<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
  tabs: {
    type: Array,
    default: () => [
      { id: 'users', label: 'Users' },
      { id: 'content', label: 'Content' },
      { id: 'reports', label: 'Reports' },
      { id: 'tags', label: 'Tags' },
      { id: 'ai', label: 'AI Settings' },
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
