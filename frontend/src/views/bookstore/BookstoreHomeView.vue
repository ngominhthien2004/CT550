<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import BookFilterBar from '@/components/bookstore/BookFilterBar.vue'
import BookGrid from '@/components/bookstore/BookGrid.vue'
import BookSection from '@/components/bookstore/BookSection.vue'
import CategoryCard from '@/components/bookstore/CategoryCard.vue'
import TagPill from '@/components/bookstore/TagPill.vue'
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

// Top-N categories that get a dedicated Booth-style section underneath
const topSectionCategories = computed(() =>
  enrichedCategories.value.slice(0, PER_CATEGORY_SECTION_COUNT),
)

function sectionBooks(category) {
  const key = category?._id || category?.id || category?.slug || category?.name
  return categorySections.value?.[key]?.books || []
}

function sectionLoading(category) {
  const key = category?._id || category?.id || category?.slug || category?.name
  return Boolean(categorySections.value?.[key]?.loading)
}

function categoryBookCount(category) {
  return (bookStore.booksByCategory.get(
    category?._id || category?.id || category?.slug || category?.name,
  ) || []).length
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
  await bookStore.fetchCategories()
  syncFiltersFromQuery()
  await bookStore.fetchBooks(pagination.value.page)

  // Prefetch a small batch for each top-level category section in parallel
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
    <div class="bookstore-home">
      <!-- Hero / Banner -->
      <section class="hero page-block">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="hero-eyebrow">IlluWrl Book Store</span>
            <h1 class="hero-title">Discover and buy<br />digital books from creators</h1>
            <p class="hero-subtitle">
              Browse comics, illustration books, novels, and guides from independent
              creators around the world. Buy once, download forever.
            </p>
            <div class="hero-actions">
              <button type="button" class="hero-cta" @click="scrollToSection('.bookstore-section--featured')">
                <i class="fa-solid fa-compass me-1"></i> Explore books
              </button>
              <router-link to="/bookstore/upload" class="hero-cta hero-cta--ghost">
                <i class="fa-solid fa-upload me-1"></i> Sell a book
              </router-link>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="hero-stack">
              <div class="hero-tile hero-tile--1"></div>
              <div class="hero-tile hero-tile--2"></div>
              <div class="hero-tile hero-tile--3"></div>
              <div class="hero-glyph"><i class="fa-solid fa-book-open"></i></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories (Booth-style 4-column grid) -->
      <section class="bookstore-section">
        <header class="section-head">
          <h2 class="section-title">
            <i class="fa-solid fa-layer-group section-title-icon"></i>
            Categories
          </h2>
          <a
            v-if="enrichedCategories.length > HERO_CATEGORY_COUNT"
            href="#all-categories"
            class="section-more"
            @click.prevent="scrollToSection('.bookstore-section--all-categories')"
          >
            Show more
            <i class="fa-solid fa-arrow-right section-more-icon" aria-hidden="true"></i>
          </a>
        </header>

        <div v-if="enrichedCategories.length" class="category-grid">
          <CategoryCard
            v-for="category in enrichedCategories.slice(0, HERO_CATEGORY_COUNT)"
            :key="category._id || category.id || category.name"
            :category="category"
            :count="categoryBookCount(category)"
            @select="selectCategory"
          />
        </div>
        <div v-else class="section-empty">
          <i class="fa-solid fa-circle-info me-1"></i>
          No categories yet.
        </div>
      </section>

      <!-- Popular Tags -->
      <section class="bookstore-section">
        <header class="section-head">
          <h2 class="section-title">
            <i class="fa-solid fa-tags section-title-icon"></i>
            Popular Tags
          </h2>
        </header>

        <div v-if="popularTags.length" class="tag-cloud">
          <TagPill
            v-for="tag in popularTags"
            :key="tag.name"
            :tag="tag"
            size="md"
            @select="selectTag"
          />
        </div>
        <div v-else class="section-empty">
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

        <div class="filter-divider">
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

        <div v-if="filters.search || filters.category || filters.minPrice || filters.maxPrice" class="filtered-grid">
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
      <section class="sell-cta page-block">
        <div class="sell-cta-glyph" aria-hidden="true">
          <i class="fa-solid fa-bullhorn"></i>
        </div>
        <div class="sell-cta-copy">
          <h2 class="sell-cta-title">Sell your work on IlluWrl Book Store!</h2>
          <p class="sell-cta-sub">
            Reach readers around the world. Publish comics, illustration books, novels,
            or guides — keep full control of your pricing and rights.
          </p>
        </div>
        <div class="sell-cta-action">
          <router-link to="/bookstore/upload" class="btn btn-warning sell-cta-btn">
            <i class="fa-solid fa-upload me-1"></i> Sell your book
          </router-link>
        </div>
      </section>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.bookstore-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  display: grid;
  gap: 2.25rem;
}

/* ── Hero ─────────────────────────────────────────────────────── */
.hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 55%),
    radial-gradient(circle at 90% 90%, color-mix(in srgb, #f59e0b 18%, transparent) 0%, transparent 55%),
    linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%);
  padding: 2.25rem 1.75rem;
  border-radius: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

@media (min-width: 768px) {
  .hero {
    padding: 3rem 2.5rem;
  }
  .hero-grid {
    grid-template-columns: 1.4fr 1fr;
    gap: 2.5rem;
  }
}

.hero-eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  margin-bottom: 0.85rem;
}

.hero-title {
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--brand);
  margin: 0 0 0.85rem;
}

.hero-subtitle {
  color: var(--muted);
  font-size: 0.98rem;
  line-height: 1.55;
  max-width: 38rem;
  margin: 0 0 1.4rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.25rem;
  font-weight: 700;
  font-size: 0.92rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  border: 1px solid var(--accent);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  box-shadow: var(--shadow-sm);
  font-family: inherit;
}

.hero-cta:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.hero-cta--ghost {
  background: transparent;
  color: var(--brand);
  border-color: var(--line);
}

.hero-cta--ghost:hover {
  background: var(--surface);
  border-color: var(--accent);
  color: var(--accent);
}

/* Decorative hero art (no real images) */
.hero-art {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.hero-stack {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 5 / 4;
}

.hero-tile {
  position: absolute;
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  background: var(--surface);
  border: 1px solid var(--line);
  overflow: hidden;
}

.hero-tile--1 {
  inset: 0% 50% 35% 0%;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 75%, #fff) 0%, var(--accent) 100%);
  transform: rotate(-6deg);
}

.hero-tile--2 {
  inset: 12% 22% 22% 18%;
  background: linear-gradient(135deg, #fde68a 0%, #f59e0b 100%);
  transform: rotate(3deg);
}

.hero-tile--3 {
  inset: 28% 0% 0% 38%;
  background: linear-gradient(135deg, #c7d2fe 0%, #6366f1 100%);
  transform: rotate(7deg);
}

.hero-glyph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 3rem;
  color: #fff;
  text-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
}

/* ── Sections (shared) ───────────────────────────────────────── */
.bookstore-section {
  display: grid;
  gap: 1rem;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand);
  letter-spacing: -0.01em;
}

.section-title-icon {
  font-size: 1rem;
  color: var(--accent);
}

.section-more {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  transition: background 0.18s ease, transform 0.18s ease;
}

.section-more:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.section-empty {
  padding: 1rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  color: var(--muted);
  text-align: center;
  font-size: 0.9rem;
  background: var(--surface);
}

/* ── Category grid ───────────────────────────────────────────── */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (min-width: 600px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
}

/* ── Tag cloud ───────────────────────────────────────────────── */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding: 0.35rem 0;
}

/* ── Featured section + filter ─────────────────────────────── */
.filter-divider {
  margin-top: 0.5rem;
}

.filtered-grid {
  display: grid;
  gap: 1.25rem;
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

/* ── Sell CTA ───────────────────────────────────────────────── */
.sell-cta {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem 1.5rem;
  border-radius: 18px;
  background:
    radial-gradient(circle at 8% 20%, color-mix(in srgb, #f59e0b 25%, transparent) 0%, transparent 55%),
    linear-gradient(135deg, #fff7e0 0%, #fde68a 100%);
  border: 1px solid color-mix(in srgb, #f59e0b 35%, var(--line));
}

@media (min-width: 768px) {
  .sell-cta {
    grid-template-columns: auto 1fr auto;
    padding: 2rem 2.25rem;
    gap: 1.75rem;
  }
}

.sell-cta-glyph {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fff;
  color: #b45309;
  font-size: 1.4rem;
  box-shadow: var(--shadow-sm);
}

.sell-cta-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--brand);
  margin: 0 0 0.35rem;
  letter-spacing: -0.01em;
}

.sell-cta-sub {
  color: #6b4f1d;
  font-size: 0.95rem;
  line-height: 1.55;
  max-width: 48rem;
}

.sell-cta-action {
  display: flex;
  justify-content: flex-start;
}

.sell-cta-btn {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #1f2937;
  font-weight: 700;
  padding: 0.7rem 1.3rem;
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.sell-cta-btn:hover {
  background: #d97706;
  border-color: #d97706;
  color: #1f2937;
  transform: translateY(-1px);
}
</style>
