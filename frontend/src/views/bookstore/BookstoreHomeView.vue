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

const FEATURED_LIMIT = 10

const featuredBooks = computed(() => books.value.slice(0, FEATURED_LIMIT))

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
  bookStore.fetchBooks(page)
  syncQueryToFilters()
}

function syncFiltersFromQuery() {
  const query = route.query
  bookStore.setFilters({
    search: query.search || '',
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

function scrollToSection(selector) {
  const el = document.querySelector(selector)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(
  () => route.query,
  () => {
    syncFiltersFromQuery()
    bookStore.fetchBooks(pagination.value.page)
  },
  { once: true },
)

onMounted(async () => {
  syncFiltersFromQuery()
  await bookStore.fetchBooks(pagination.value.page)
})
</script>

<template>
  <BookstoreLayout>
    <div class="bookstore-page">
      <!-- Hero / Banner -->
      <section class="bookstore-hero page-block">
        <div class="bookstore-hero-grid">
          <div class="bookstore-hero-copy">
            <span class="bookstore-hero-eyebrow">{{ $t('bookstore.bookstore') }}</span>
            <h1 class="bookstore-hero-title">{{ $t('bookstore.heroTitle') }}</h1>
            <p class="bookstore-hero-subtitle">{{ $t('bookstore.heroSubtitle') }}</p>
            <div class="bookstore-hero-actions">
              <button type="button" class="bookstore-hero-cta" @click="scrollToSection('.bookstore-section--featured')">
                <i class="fa-solid fa-compass me-1"></i> {{ $t('bookstore.exploreBooks') }}
              </button>
              <router-link to="/bookstore/upload" class="bookstore-hero-cta bookstore-hero-cta--ghost">
                <i class="fa-solid fa-upload me-1"></i> {{ $t('bookstore.sellABook') }}
              </router-link>
            </div>
          </div>
          <div class="bookstore-hero-art" aria-hidden="true">
            <div class="bookstore-hero-stack">
              <div class="bookstore-hero-tile bookstore-hero-tile--1"></div>
              <div class="bookstore-hero-tile bookstore-hero-tile--2"></div>
              <div class="bookstore-hero-tile bookstore-hero-tile--3"></div>
              <div class="bookstore-hero-glyph"><i class="fa-solid fa-book-open"></i></div>
            </div>
          </div>
        </div>
      </section>

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

      <!-- Featured / Latest books -->
      <section class="bookstore-section bookstore-section--featured">
        <BookSection
          :title="$t('bookstore.featured')"
          icon="fa-fire"
          :books="featuredBooks"
          :loading="loading && books.length === 0"
          :limit="FEATURED_LIMIT"
          :show-more="false"
        />

        <BookFilterBar
          v-model:filters="filters"
          :loading="loading"
          @search="applyFilters"
        />

        <div v-if="bookStore.booksError" class="alert alert-danger" role="alert">
          {{ bookStore.booksError }}
        </div>

        <div v-if="filters.search || filters.minPrice || filters.maxPrice" class="bookstore-filtered-grid">
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

      <!-- Sell your work CTA -->
      <section class="bookstore-cta-sell page-block">
        <div class="bookstore-cta-sell-glyph" aria-hidden="true">
          <i class="fa-solid fa-bullhorn"></i>
        </div>
        <div class="bookstore-cta-sell-copy">
          <h2 class="bookstore-cta-sell-title">{{ $t('bookstore.sellYourWork') }}</h2>
          <p class="bookstore-cta-sell-sub">{{ $t('bookstore.sellSubtitle') }}</p>
        </div>
        <div class="bookstore-cta-sell-action">
          <router-link to="/bookstore/upload" class="btn btn-warning bookstore-cta-sell-btn">
            <i class="fa-solid fa-upload me-1"></i> {{ $t('bookstore.sellYourBook') }}
          </router-link>
        </div>
      </section>
    </div>
  </BookstoreLayout>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
