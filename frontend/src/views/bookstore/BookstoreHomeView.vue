<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import BookFilterBar from '@/components/bookstore/BookFilterBar.vue'
import BookGrid from '@/components/bookstore/BookGrid.vue'
import { useBookStore } from '@/stores/book.store.js'
import { toggleNavCollapsed } from '@/utils/viewNavigation.js'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const isNavCollapsed = ref(true)

const filters = computed({
  get: () => bookStore.filters,
  set: (value) => {
    bookStore.filters = value
  },
})

const books = computed(() => bookStore.books)
const loading = computed(() => bookStore.booksLoading)
const pagination = computed(() => bookStore.pagination)

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

function applyFilters() {
  bookStore.setFilters({ ...filters.value })
  bookStore.fetchBooks(1)
  syncQueryToFilters()
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pages) return
  bookStore.fetchBooks(page)
  syncQueryToFilters()
}

function syncFiltersFromQuery() {
  const query = route.query
  bookStore.setFilters({
    search: query.search || '',
    category: query.category || '',
    sort: query.sort || 'newest',
    minPrice: query.minPrice || '',
    maxPrice: query.maxPrice || '',
  })
}

function syncQueryToFilters() {
  const query = {}
  if (filters.value.search) query.search = filters.value.search
  if (filters.value.category) query.category = filters.value.category
  if (filters.value.sort && filters.value.sort !== 'newest') query.sort = filters.value.sort
  if (filters.value.minPrice) query.minPrice = filters.value.minPrice
  if (filters.value.maxPrice) query.maxPrice = filters.value.maxPrice

  router.replace({ path: '/bookstore', query })
}

watch(
  () => route.query,
  () => {
    syncFiltersFromQuery()
    bookStore.fetchBooks(pagination.value.page)
  },
  { once: true },
)

onMounted(() => {
  bookStore.fetchCategories()
  syncFiltersFromQuery()
  bookStore.fetchBooks(pagination.value.page)
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="bookstore-page page-block p-3 p-md-4">
      <div class="page-header">
        <h1 class="page-title">Book Store</h1>
        <router-link to="/bookstore/upload" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-upload me-1"></i> Sell a book
        </router-link>
      </div>

      <BookFilterBar
        v-model:filters="filters"
        :categories="bookStore.categories"
        :loading="loading"
        @search="applyFilters"
      />

      <div v-if="bookStore.booksError" class="alert alert-danger" role="alert">
        {{ bookStore.booksError }}
      </div>

      <BookGrid :books="books" :loading="loading" />

      <nav v-if="pagination.pages > 1" class="pagination-wrap" aria-label="Book pagination">
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
            <button type="button" class="page-link" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">Previous</button>
          </li>
          <li v-for="page in pagination.pages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
            <button type="button" class="page-link" @click="goToPage(page)">{{ page }}</button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
            <button type="button" class="page-link" :disabled="pagination.page >= pagination.pages" @click="goToPage(pagination.page + 1)">Next</button>
          </li>
        </ul>
      </nav>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.bookstore-page {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--brand);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.pagination .page-link {
  background: var(--surface);
  border-color: var(--line);
  color: var(--text);
}

.pagination .page-item.active .page-link {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}
</style>
