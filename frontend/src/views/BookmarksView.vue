<script setup>
import { onMounted } from 'vue'
import { useBookmarkStore } from '../stores/bookmark.store'
import BookmarksList from '../components/bookmarks/BookmarksList.vue'

const bookmarkStore = useBookmarkStore()

onMounted(() => {
  bookmarkStore.fetchMyBookmarks()
})
</script>

<template>
  <section class="page">
    <h2>My Bookmarks</h2>
    <p v-if="bookmarkStore.loading">Loading bookmarks...</p>
    <p v-else-if="bookmarkStore.error">{{ bookmarkStore.error }}</p>
    <BookmarksList v-else :items="bookmarkStore.items" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 0.75rem;
}

h2 {
  margin: 0;
}
</style>
