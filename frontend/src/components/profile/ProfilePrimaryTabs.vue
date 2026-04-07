<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'home',
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <nav class="profile-tabs" aria-label="Profile sections">
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'home' }" @click="emit('select', 'home')">Home</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'illustrations' }" @click="emit('select', 'illustrations')">Illustrations</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'bookmarks' }" @click="emit('select', 'bookmarks')">Bookmarks</button>
  </nav>
</template>

<style scoped>
.profile-tabs {
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #edf0f4;
}

.profile-tab {
  border: none;
  background: transparent;
  text-decoration: none;
  color: #6b7280;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0.82rem 0.85rem;
  border-bottom: 2px solid transparent;
}

.profile-tab.active {
  color: #1f2937;
  border-bottom-color: #0096fa;
}
</style>
