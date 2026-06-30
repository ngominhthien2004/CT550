<script setup>
import { inject } from 'vue'

const isOwnProfile = inject('isOwnProfile')
const activeTab = inject('activeMainTab')
const selectTab = inject('selectMainTab')
</script>

<template>
  <nav class="profile-tabs" aria-label="Profile sections">
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'home' }" @click="selectTab('home')">Home</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'illustrations' }" @click="selectTab('illustrations')">Illustrations</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'manga' }" @click="selectTab('manga')">Manga</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'novels' }" @click="selectTab('novels')">Novels</button>
    <button type="button" class="profile-tab" :class="{ active: activeTab === 'requests' }" @click="selectTab('requests')">Requests</button>
    <button v-if="isOwnProfile" type="button" class="profile-tab" :class="{ active: activeTab === 'bookmarks' }" @click="selectTab('bookmarks')">Bookmarks</button>
    <button v-if="isOwnProfile" type="button" class="profile-tab" :class="{ active: activeTab === 'likes' }" @click="selectTab('likes')">Favorites</button>
    <button v-if="isOwnProfile" type="button" class="profile-tab" :class="{ active: activeTab === 'blocked' }" @click="selectTab('blocked')">Blocked</button>
  </nav>
</template>

<style scoped>
.profile-tabs {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}

.profile-tab {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.95rem 0.1rem 0.85rem;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.profile-tab.active {
  color: var(--brand);
  border-bottom-color: #0096fa;
}
</style>
