<script setup>
import { onMounted, ref } from 'vue'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import SellerBookRow from '@/components/bookstore/SellerBookRow.vue'
import BookStoreTopBar from '@/components/bookstore/BookStoreTopBar.vue'
import { useBookStore } from '@/stores/book.store.js'
import { toggleNavCollapsed } from '@/utils/viewNavigation.js'

const bookStore = useBookStore()
const isNavCollapsed = ref(true)

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

async function loadBooks() {
  await bookStore.fetchMyBooks()
}

onMounted(() => {
  loadBooks()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <BookStoreTopBar />
    <section class="bookstore-page page-block p-3 p-md-4">
      <div class="page-header">
        <h1 class="page-title">My Books</h1>
        <router-link to="/bookstore/upload" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-plus me-1"></i> Upload new
        </router-link>
      </div>

      <div v-if="bookStore.myBooksError" class="alert alert-danger" role="alert">
        {{ bookStore.myBooksError }}
      </div>

      <div v-if="bookStore.myBooksLoading && bookStore.myBooks.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="bookStore.myBooks.length === 0" class="empty-state">
        <i class="fa-solid fa-book-open empty-icon"></i>
        <p>You haven't uploaded any books yet.</p>
        <router-link to="/bookstore/upload" class="btn btn-primary">Upload your first book</router-link>
      </div>

      <div v-else class="book-list">
        <SellerBookRow
          v-for="book in bookStore.myBooks"
          :key="book._id"
          :book="book"
          @updated="loadBooks"
          @deleted="loadBooks"
        />
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.bookstore-page {
  max-width: 900px;
  margin: 0 auto;
  /* Offset for fixed BookStoreTopBar (top: 72px + 60px height) */
  padding-top: 132px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0;
}

.book-list {
  display: grid;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--line);
}
</style>
