<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['change-tab'])
</script>

<template>
  <div class="admin-tabs" role="tablist" aria-label="Admin sections">
    <button
      type="button"
      role="tab"
      class="admin-tab"
      :class="{ 'is-active': activeTab === 'users' }"
      :aria-selected="activeTab === 'users'"
      aria-controls="admin-user-panel"
      @click="emit('change-tab', 'users')"
    >
      User management
    </button>
    <button
      type="button"
      role="tab"
      class="admin-tab"
      :class="{ 'is-active': activeTab === 'artworks' }"
      :aria-selected="activeTab === 'artworks'"
      aria-controls="admin-artwork-panel"
      @click="emit('change-tab', 'artworks')"
    >
      Artwork moderation
    </button>
  </div>
</template>
