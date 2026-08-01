<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import BookFilterBar from '@/components/bookstore/BookFilterBar.vue'
import BookGrid from '@/components/bookstore/BookGrid.vue'
import BookSection from '@/components/bookstore/BookSection.vue'
import TagStrip from '@/components/shared/TagStrip.vue'
import { useBookStore } from '@/stores/book.store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const filters = computed({
  get: () => bookStore.filters,
  set: (value) => {
    bookStore.filters = value
  },
})

const books = computed(() => bookStore.books)
const loading = computed(() => bookStore.booksLoading)
const pagination = computed(() => bookStore.pagination)
const popularTags = computed(() => bookStore.popularTags)

const FEATURED_LIMIT = 12

const hasActiveFilters = computed(() => {
  const f = filters.value
  return !!(f.search || f.minPrice || f.maxPrice || (f.sort && f.sort !== 'newest'))
})

// TagStrip accepts plain tag strings and renders them verbatim. The store
// returns `{name, count}` objects, so flatten to just the names and prepend
// "#" to match the original `TagPill` visual. TagStrip's `button` variant
// strips the leading "#" before emitting, so the click handler still receives
// the raw tag name.
const popularTagNames = computed(() => popularTags.value.map((t) => `#${t.name}`))

function applyFilters() {
  bookStore.setFilters({ ...filters.value })
  bookStore.fetchBooks(1)
  syncQueryToFilters()
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pages) return
  bookStore.fetchBooks(page, hasActiveFilters.value ? undefined : FEATURED_LIMIT)
  syncQueryToFilters()
}

function syncFiltersFromQuery() {
  const query = route.query
  // `?tag=<name>` is a convenience shortcut equivalent to searching by tag name.
  // Prefer the explicit `search` param when both are present.
  const searchFromQuery = query.search || (query.tag ? String(query.tag) : '')
  bookStore.setFilters({
    search: searchFromQuery,
    sort: query.sort || 'newest',
    minPrice: query.minPrice || '',
    maxPrice: query.maxPrice || '',
  })
}

function syncQueryToFilters() {
  const query = {}
  if (filters.value.search) query.search = filters.value.search
  if (filters.value.sort && filters.value.sort !== 'newest') query.sort = filters.value.sort
  if (filters.value.minPrice) query.minPrice = filters.value.minPrice
  if (filters.value.maxPrice) query.maxPrice = filters.value.maxPrice

  router.replace({ path: '/bookstore', query })
}

function selectTag(tagName) {
  bookStore.setFilters({ search: tagName })
  router.push({
    path: '/bookstore',
    query: { ...route.query, search: tagName },
  })
  bookStore.fetchBooks(1)
}

// React to browser back/forward navigation by re-syncing filters from
// the URL. The initial load is handled in onMounted, so skip the
// first invocation (when oldQuery is undefined).
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (!oldQuery) return
    syncFiltersFromQuery()
    bookStore.fetchBooks(1, hasActiveFilters.value ? undefined : FEATURED_LIMIT)
  }
)

onMounted(async () => {
  syncFiltersFromQuery()
  await bookStore.fetchBooks(pagination.value.page, hasActiveFilters.value ? undefined : FEATURED_LIMIT)
})
</script>

<template>
  <BookstoreLayout>
    <div class="bookstore-page">
      <!-- Popular Tags -->
      <section class="bookstore-section">
        <header class="bookstore-section-head">
          <h2 class="bookstore-section-title">
            <i class="fa-solid fa-tags bookstore-section-title-icon"></i>
            {{ $t('bookstore.popularTags') }}
          </h2>
        </header>

        <div v-if="popularTagNames.length" class="bookstore-tags-cloud">
          <TagStrip
            :tags="popularTagNames"
            variant="button"
            compact
            @tag-click="selectTag"
          />
        </div>
        <div v-else class="bookstore-section-empty">
          <i class="fa-solid fa-circle-info me-1"></i>
          {{ $t('bookstore.noTagsYet') }}
        </div>
      </section>

      <!-- No active filters: show featured / latest books with pagination -->
      <section v-if="!hasActiveFilters" class="bookstore-section bookstore-section--featured">
        <BookSection
          :title="$t('bookstore.featured')"
          icon="fa-fire"
          :books="books"
          :loading="loading && books.length === 0"
          :limit="FEATURED_LIMIT"
          :show-more="false"
        />
        <nav v-if="pagination.pages > 1" class="bookstore-pagination-wrap bookstore-pagination" :aria-label="$t('bookstore.featured')">
          <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
              <button type="button" class="page-link" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">{{ $t('bookstore.previous') }}</button>
            </li>
            <li v-for="page in pagination.pages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
              <button type="button" class="page-link" @click="goToPage(page)">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
              <button type="button" class="page-link" :disabled="pagination.page >= pagination.pages" @click="goToPage(pagination.page + 1)">{{ $t('bookstore.next') }}</button>
            </li>
          </ul>
        </nav>
      </section>

      <!-- Active filters: show filter toolbar + filtered results -->
      <section v-else class="bookstore-section bookstore-section--results">
        <BookFilterBar
          v-model:filters="filters"
          :loading="loading"
          @search="applyFilters"
        />

        <div v-if="bookStore.booksError" class="alert alert-danger" role="alert">
          {{ bookStore.booksError }}
        </div>

        <div class="bookstore-filtered-grid">
          <BookGrid :books="books" :loading="loading" />
          <nav v-if="pagination.pages > 1" class="bookstore-pagination-wrap bookstore-pagination" :aria-label="$t('bookstore.bookstore')">
            <ul class="pagination mb-0">
              <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                <button type="button" class="page-link" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">{{ $t('bookstore.previous') }}</button>
              </li>
              <li v-for="page in pagination.pages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
                <button type="button" class="page-link" @click="goToPage(page)">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
                <button type="button" class="page-link" :disabled="pagination.page >= pagination.pages" @click="goToPage(pagination.page + 1)">{{ $t('bookstore.next') }}</button>
              </li>
            </ul>
          </nav>
        </div>
      </section>

    </div>
  </BookstoreLayout>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
