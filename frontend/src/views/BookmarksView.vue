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
  <section class="page d-grid gap-3">
    <h2 class="mb-0">My Bookmarks</h2>
    <div class="row g-2">
      <div class="col-12 col-lg-5">
        <input v-model="artworkId" class="form-control" placeholder="Artwork ID" />
      </div>
      <div class="col-12 col-lg-4">
        <input v-model="folder" class="form-control" placeholder="Folder (default)" />
      </div>
      <div class="col-12 col-sm-6 col-lg-1 d-grid">
        <button class="btn btn-primary" @click="submitBookmark">Add</button>
      </div>
      <div class="col-12 col-sm-6 col-lg-2 d-grid">
        <button class="btn btn-outline-secondary" @click="removeBookmark">Delete latest</button>
      </div>
    </div>
    <p v-if="bookmarkStore.loading" class="text-secondary mb-0">Loading bookmarks...</p>
    <p v-else-if="bookmarkStore.error" class="text-danger mb-0">{{ bookmarkStore.error }}</p>
    <BookmarksList v-else :items="bookmarkStore.items" />
  </section>
</template>

<style scoped>
.page {
  padding: 0.25rem 0;
}
</style>
