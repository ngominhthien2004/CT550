<script setup>
import { onMounted, ref } from 'vue'
import { useBookmarkStore } from '../stores/bookmark.store'
import BookmarksList from '../components/bookmarks/BookmarksList.vue'

const bookmarkStore = useBookmarkStore()
const artworkId = ref('')
const folder = ref('default')

const submitBookmark = async () => {
  if (!artworkId.value.trim()) {
    bookmarkStore.error = 'Please enter artworkId'
    return
  }
  await bookmarkStore.addBookmark(artworkId.value.trim(), folder.value || 'default')
  artworkId.value = ''
}

const removeBookmark = async () => {
  if (!bookmarkStore.items.length) {
    bookmarkStore.error = 'No bookmark available to delete'
    return
  }
  await bookmarkStore.removeBookmark(bookmarkStore.items[0]._id)
}

onMounted(() => {
  bookmarkStore.fetchMyBookmarks()
})
</script>

<template>
  <section class="page">
    <h2>My Bookmarks</h2>
    <div class="actions">
      <input v-model="artworkId" placeholder="Artwork ID" />
      <input v-model="folder" placeholder="Folder (default)" />
      <button @click="submitBookmark">Add</button>
      <button class="secondary" @click="removeBookmark">Delete latest</button>
    </div>
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

.actions {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto auto;
  gap: 0.5rem;
}

input,
button {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
}

button {
  cursor: pointer;
  border-color: #0f172a;
  background: #0f172a;
  color: #fff;
  font-weight: 600;
}

button.secondary {
  border-color: #cbd5e1;
  background: #fff;
  color: #0f172a;
}

@media (max-width: 880px) {
  .actions {
    grid-template-columns: 1fr;
  }
}
</style>
