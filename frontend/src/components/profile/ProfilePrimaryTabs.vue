<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'home',
  },
  isOwnProfile: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <nav class="profile-tabs" aria-label="Profile sections">
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'home' }" @click="emit('select', 'home')">Home</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'illustrations' }" @click="emit('select', 'illustrations')">Illustrations</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'requests' }" @click="emit('select', 'requests')">Requests</button>
    <button v-if="isOwnProfile" type="button" class="profile-tab" :class="{ active: activeTab === 'bookmarks' }" @click="emit('select', 'bookmarks')">Bookmarks</button>
    <button v-if="isOwnProfile" type="button" class="profile-tab" :class="{ active: activeTab === 'likes' }" @click="emit('select', 'likes')">Favorites</button>
  </nav>
</template>

<style scoped>
.profile-tabs {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  border-bottom: 1px solid #edf0f4;
  overflow-x: auto;
}

.profile-tab {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.95rem 0.1rem 0.85rem;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.profile-tab.active {
  color: #1f2937;
  border-bottom-color: #0096fa;
}
</style>
