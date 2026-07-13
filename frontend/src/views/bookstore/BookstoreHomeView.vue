<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import BookFilterBar from '@/components/bookstore/BookFilterBar.vue'
import BookGrid from '@/components/bookstore/BookGrid.vue'
import BookSection from '@/components/bookstore/BookSection.vue'
import CategoryCard from '@/components/bookstore/CategoryCard.vue'
import TagStrip from '@/components/shared/TagStrip.vue'
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
const categories = computed(() => bookStore.categories)
const popularTags = computed(() => bookStore.popularTags)
const categorySections = computed(() => bookStore.categorySections)

// Default Font Awesome icons assigned to common book categories
const CATEGORY_ICON_FALLBACKS = [
  'fa-book',
  'fa-book-open',
  'fa-feather',
  'fa-palette',
  'fa-pen-nib',
  'fa-scroll',
  'fa-mug-hot',
  'fa-hat-wizard',
  'fa-dragon',
  'fa-ghost',
  'fa-rocket',
  'fa-gamepad',
  'fa-music',
  'fa-cube',
  'fa-shirt',
  'fa-comments',
  'fa-heart',
  'fa-magnifying-glass',
  'fa-star',
  'fa-flask',
]

function iconForCategory(category) {
  if (!category) return 'fa-book'
  if (category.icon) return category.icon
  // Stable hash → icon so a category always gets the same glyph
  const key = category._id || category.id || category.slug || category.name || ''
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return CATEGORY_ICON_FALLBACKS[hash % CATEGORY_ICON_FALLBACKS.length]
}

function accentForCategory(category) {
  if (category?.accent) return category.accent
  const palette = ['var(--accent)', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#6366f1']
  const key = category?._id || category?.id || category?.slug || category?.name || ''
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return palette[hash % palette.length]
}

const enrichedCategories = computed(() =>
  categories.value.map((cat) => ({
    ...cat,
    icon: iconForCategory(cat),
    accent: accentForCategory(cat),
  })),
)

const FEATURED_LIMIT = 8
const SECTION_LIMIT = 4
const HERO_CATEGORY_COUNT = 8
const PER_CATEGORY_SECTION_COUNT = 5

const featuredBooks = computed(() => books.value.slice(0, FEATURED_LIMIT))

// TagStrip accepts plain tag strings and renders them verbatim. The store
// returns `{name, count}` objects, so flatten to just the names and prepend
// "#" to match the original `TagPill` visual. TagStrip's `button` variant
// strips the leading "#" before emitting, so the click handler still receives
// the raw tag name.
const popularTagNames = computed(() => popularTags.value.map((t) => `#${t.name}`))

// Top-N categories that get a dedicated Booth-style section underneath
const topSectionCategories = computed(() =>
  enrichedCategories.value.slice(0, PER_CATEGORY_SECTION_COUNT),
)

function sectionBooks(category) {
  // Always use the category's _id as the cache key — the store's
  // fetchBooksByCategory is called with the same _id in onMounted, so
  // the lookup matches even when the category is fetched again.
  const key = category?._id || category?.id
  if (!key) return []
  return categorySections.value?.[key]?.books || []
}

function sectionLoading(category) {
  const key = category?._id || category?.id
  if (!key) return false
  return Boolean(categorySections.value?.[key]?.loading)
}

function categoryBookCount(category) {
  const key = category?._id || category?.id || category?.slug || category?.name
  if (!key) return 0
  return (bookStore.booksByCategory.get(key) || []).length
}

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

function selectCategory(category) {
  bookStore.setFilters({ category: category.slug || category._id || category.name || '' })
  router.push({
    path: '/bookstore',
    query: { ...route.query, category: bookStore.filters.category },
  })
  bookStore.fetchBooks(1)
}

function selectTag(tagName) {
  bookStore.setFilters({ search: tagName, category: '' })
  router.push({
    path: '/bookstore',
    query: { ...route.query, search: tagName, category: undefined },
  })
  bookStore.fetchBooks(1)
}

function showMoreForCategory(category) {
  selectCategory(category)
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
  // Make sure categories are loaded BEFORE books so the per-category
  // sections have something to render and the tag aggregation has books
  // to count against.
  await bookStore.fetchCategories()
  syncFiltersFromQuery()
  await bookStore.fetchBooks(pagination.value.page)

  // Prefetch a small batch for each top-level category section in parallel.
  // Pass the category _id (the book-service `listBooks` filter rejects
  // category names, returning 400). The store will resolve slug/name → _id
  // automatically, but we prefer the raw _id here for clarity.
  const top = enrichedCategories.value.slice(0, PER_CATEGORY_SECTION_COUNT)
  await Promise.all(
    top.map((cat) => bookStore.fetchBooksByCategory(
      cat._id || cat.id || cat.slug || cat.name,
      { limit: SECTION_LIMIT },
    )),
  )
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="bookstore-page">
      <!-- Hero / Banner -->
      <section class="bookstore-hero page-block">
        <div class="bookstore-hero-grid">
          <div class="bookstore-hero-copy">
            <span class="bookstore-hero-eyebrow">IlluWrl Book Store</span>
            <h1 class="bookstore-hero-title">Discover and buy<br />digital books from creators</h1>
            <p class="bookstore-hero-subtitle">
              Browse comics, illustration books, novels, and guides from independent
              creators around the world. Buy once, download forever.
            </p>
            <div class="bookstore-hero-actions">
              <button type="button" class="bookstore-hero-cta" @click="scrollToSection('.bookstore-section--featured')">
                <i class="fa-solid fa-compass me-1"></i> Explore books
              </button>
              <router-link to="/bookstore/upload" class="bookstore-hero-cta bookstore-hero-cta--ghost">
                <i class="fa-solid fa-upload me-1"></i> Sell a book
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

      <!-- Categories (Booth-style 4-column grid) -->
      <section class="bookstore-section">
        <header class="bookstore-section-head">
          <h2 class="bookstore-section-title">
            <i class="fa-solid fa-layer-group bookstore-section-title-icon"></i>
            Categories
          </h2>
          <a
            v-if="enrichedCategories.length > HERO_CATEGORY_COUNT"
            href="#all-categories"
            class="bookstore-section-more"
            @click.prevent="scrollToSection('.bookstore-section--all-categories')"
          >
            Show more
            <i class="fa-solid fa-arrow-right bookstore-section-more-icon" aria-hidden="true"></i>
          </a>
        </header>

        <div v-if="enrichedCategories.length" class="bookstore-categories-grid">
          <CategoryCard
            v-for="category in enrichedCategories.slice(0, HERO_CATEGORY_COUNT)"
            :key="category._id || category.id || category.name"
            :category="category"
            :count="categoryBookCount(category)"
            @select="selectCategory"
          />
        </div>
        <div v-else class="bookstore-section-empty">
          <i class="fa-solid fa-circle-info me-1"></i>
          No categories yet.
        </div>
      </section>

      <!-- Popular Tags -->
      <section class="bookstore-section">
        <header class="bookstore-section-head">
          <h2 class="bookstore-section-title">
            <i class="fa-solid fa-tags bookstore-section-title-icon"></i>
            Popular Tags
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
          No tags yet — be the first to publish a book.
        </div>
      </section>

      <!-- Featured / Latest books -->
      <section class="bookstore-section bookstore-section--featured">
        <BookSection
          title="Featured"
          icon="fa-fire"
          :books="featuredBooks"
          :loading="loading && books.length === 0"
          :limit="FEATURED_LIMIT"
          :show-more="false"
        />

        <div class="bookstore-filter-divider">
          <BookFilterBar
            v-model:filters="filters"
            :categories="categories"
            :loading="loading"
            @search="applyFilters"
          />
        </div>

        <div v-if="bookStore.booksError" class="alert alert-danger" role="alert">
          {{ bookStore.booksError }}
        </div>

        <div v-if="filters.search || filters.category || filters.minPrice || filters.maxPrice" class="bookstore-filtered-grid">
          <BookGrid :books="books" :loading="loading" />
          <nav v-if="pagination.pages > 1" class="bookstore-pagination-wrap bookstore-pagination" aria-label="Book pagination">
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
        </div>
      </section>

      <!-- All categories sections (Booth-style stacked sections) -->
      <section
        v-for="category in topSectionCategories"
        :key="category._id || category.id || category.name"
        class="bookstore-section"
      >
        <BookSection
          :title="category.name"
          :icon="category.icon"
          :books="sectionBooks(category)"
          :loading="sectionLoading(category) && sectionBooks(category).length === 0"
          :limit="SECTION_LIMIT"
          :show-more="true"
          @show-more="showMoreForCategory(category)"
        />
      </section>

      <!-- Sell your work CTA -->
      <section class="bookstore-cta-sell page-block">
        <div class="bookstore-cta-sell-glyph" aria-hidden="true">
          <i class="fa-solid fa-bullhorn"></i>
        </div>
        <div class="bookstore-cta-sell-copy">
          <h2 class="bookstore-cta-sell-title">Sell your work on IlluWrl Book Store!</h2>
          <p class="bookstore-cta-sell-sub">
            Reach readers around the world. Publish comics, illustration books, novels,
            or guides — keep full control of your pricing and rights.
          </p>
        </div>
        <div class="bookstore-cta-sell-action">
          <router-link to="/bookstore/upload" class="btn btn-warning bookstore-cta-sell-btn">
            <i class="fa-solid fa-upload me-1"></i> Sell your book
          </router-link>
        </div>
      </section>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
