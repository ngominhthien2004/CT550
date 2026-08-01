<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'
import { useBookStore } from '@/stores/book.store.js'
import { useFollowStore } from '@/stores/follow.store.js'
import AppTopBarUserMenu from '@/components/layout/AppTopBar/AppTopBarUserMenu.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const authStore = useAuthStore()
const followStore = useFollowStore()

const searchQuery = ref('')
const isSearchFocused = ref(false)

const initialQuery = computed(() => {
  const raw = route.query?.search
  if (Array.isArray(raw)) return raw[0] || ''
  return typeof raw === 'string' ? raw : ''
})

// Pre-fill from the active route query (e.g. when landing on /bookstore?search=foo)
watch(
  initialQuery,
  (value) => {
    if (value) searchQuery.value = value
  },
  { immediate: true },
)

// --- Filter dropdown state ---
const isFilterOpen = ref(false)
const filterDraft = ref({ sort: 'newest', minPrice: '', maxPrice: '' })
const filterRef = ref(null)

// Initialize filter draft from the current route query so the dropdown
// shows the correct state when the user opens it.
function syncFilterDraftFromQuery(query) {
  filterDraft.value = {
    sort: query.sort || 'newest',
    minPrice: query.minPrice || '',
    maxPrice: query.maxPrice || '',
  }
}

watch(
  () => route.query,
  (query) => syncFilterDraftFromQuery(query),
  { immediate: true },
)

function toggleFilterDropdown() {
  syncFilterDraftFromQuery(route.query)
  isFilterOpen.value = !isFilterOpen.value
}

function applyFilterDraft() {
  const query = { ...route.query }
  const draft = filterDraft.value

  if (draft.sort && draft.sort !== 'newest') query.sort = draft.sort
  else delete query.sort
  if (draft.minPrice) query.minPrice = draft.minPrice
  else delete query.minPrice
  if (draft.maxPrice) query.maxPrice = draft.maxPrice
  else delete query.maxPrice

  // Preserve the search term from the topbar input
  const trimmed = searchQuery.value.trim()
  if (trimmed) query.search = trimmed
  else delete query.search
  query.page = undefined

  router.push({ path: '/bookstore', query })
  isFilterOpen.value = false
}

function onClickOutsideFilter(e) {
  if (filterRef.value && !filterRef.value.contains(e.target)) {
    isFilterOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutsideFilter)
  // Fetch cart count so the badge shows immediately on any bookstore page
  if (isLoggedIn.value) {
    bookStore.fetchCart()
  }
})
onUnmounted(() => document.removeEventListener('click', onClickOutsideFilter))

// Sort options for the filter dropdown (same set as BookFilterBar, but we store
// resolved labels for use directly in the template).
const bookSortOptions = computed(() => [
  { value: 'newest', label: t('bookstore.sortLatest') },
  { value: 'priceAsc', label: t('bookstore.sortPriceAsc') },
  { value: 'priceDesc', label: t('bookstore.sortPriceDesc') },
  { value: 'popular', label: t('bookstore.sortPopular') },
])

function selectSort(value) {
  filterDraft.value.sort = value
}

// Reactive cart count pulled from the Pinia store. The store already exposes
// `cartItemCount` as a derived getter; re-read it through `state` so the
// template reacts when `fetchCart` / `addBookToCart` / `removeFromCart` update it.
const cartCount = computed(() => bookStore.cartItemCount)

// User-menu data. Pulls from the global auth store so the menu reflects the
// current session (login, logout, or page reload).
const currentUser = computed(() => authStore.user)
const isLoggedIn = computed(() => Boolean(authStore.isAuthenticated))
const userId = computed(() => currentUser.value?._id || '')
const userAvatar = computed(() => currentUser.value?.avatar || '')
const userDisplayName = computed(() => currentUser.value?.username || t('common.unknown'))
const userStats = computed(() => ({
  following: followStore.followingCount,
  followers: followStore.followersCount,
}))

const userMainLinks = computed(() => [
  { label: t('bookstore.myBooks'), to: '/bookstore/manage' },
  { label: t('bookstore.myLibrary'), to: '/bookstore/library' },
])

const userLibraryLinks = computed(() => [
  { label: t('bookstore.bookmarks'), to: '/bookstore/bookmarks' },
  { label: t('bookstore.cart'), to: '/bookstore/cart' },
  { label: t('bookstore.myOrders'), to: '/bookstore/orders' },
])

const userSettingLinks = computed(() => [
  { label: t('bookstore.sellABook'), to: '/bookstore/upload' },
  { label: t('bookstore.backToIlluWrl'), to: '/' },
])

// Trigger follow data load when user is authenticated (mirrors the main
// AppTopBar pattern so the hero stats stay in sync with the global store).
watch(
  () => userId.value,
  (id) => {
    if (!authStore.isAuthenticated || !id) {
      followStore.fetchFollowing('')
      followStore.fetchFollowers('')
      return
    }
    followStore.fetchFollowing(id)
    followStore.fetchFollowers(id)
  },
  { immediate: true },
)

function onSearch() {
  const trimmed = searchQuery.value.trim()
  router.push({
    path: '/bookstore',
    query: trimmed
      ? { ...route.query, search: trimmed, page: undefined }
      : { ...route.query, search: undefined, page: undefined },
  })
}

function clearSearch() {
  searchQuery.value = ''
  onSearch()
}

async function handleLogout() {
  authStore.logout()
  await router.push('/')
}
</script>

<template>
  <div class="bookstore-topbar">
    <div class="bookstore-topbar-inner">
      <!-- Left: brand link -->
      <router-link to="/bookstore" class="bookstore-topbar-brand">
        <span class="bookstore-topbar-brand-icon" aria-hidden="true">
          <i class="fa-solid fa-book-bookmark"></i>
        </span>
        <span class="bookstore-topbar-brand-text">
          <span class="bookstore-topbar-brand-eyebrow">IlluWrl</span>
          <span class="bookstore-topbar-brand-title">Book Store</span>
        </span>
      </router-link>

      <!-- Center: search + filter -->
      <div class="bookstore-topbar-search-group">
        <form class="bookstore-topbar-search" @submit.prevent="onSearch">
          <span class="bookstore-topbar-search-icon" aria-hidden="true">
            <i class="fa-solid fa-magnifying-glass"></i>
          </span>
          <input
            v-model="searchQuery"
            type="search"
            name="search"
            class="bookstore-topbar-search-input"
            :class="{ 'is-focused': isSearchFocused }"
            placeholder="Search books by title or tag…"
            aria-label="Search books"
            @focus="isSearchFocused = true"
            @blur="isSearchFocused = false"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="bookstore-topbar-search-clear"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </form>

        <!-- Filter toggle button + dropdown -->
        <div ref="filterRef" class="bookstore-topbar-filter-wrap">
          <button
            type="button"
            class="bookstore-topbar-filter-btn"
            :class="{ 'is-active': isFilterOpen }"
            aria-label="Filters"
            :title="t('bookstore.filter')"
            @click="toggleFilterDropdown"
          >
            <i class="fa-solid fa-sliders"></i>
          </button>

          <div v-if="isFilterOpen" class="dd-panel bookstore-filter-panel">
            <div class="filter-dd-section">
              <span class="filter-dd-label">{{ t('bookstore.sortBy') }}</span>
              <div class="filter-dd-pills">
                <button
                  v-for="opt in bookSortOptions"
                  :key="opt.value"
                  type="button"
                  class="filter-dd-pill"
                  :class="{ 'is-active': filterDraft.sort === opt.value }"
                  @click="selectSort(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="filter-dd-section">
              <span class="filter-dd-label">{{ t('bookstore.price') }}</span>
              <div class="filter-dd-price">
                <input
                  v-model.number="filterDraft.minPrice"
                  type="number"
                  class="filter-dd-input"
                  :placeholder="t('bookstore.minPrice')"
                  min="0"
                />
                <span class="filter-dd-sep">–</span>
                <input
                  v-model.number="filterDraft.maxPrice"
                  type="number"
                  class="filter-dd-input"
                  :placeholder="t('bookstore.maxPrice')"
                  min="0"
                />
              </div>
            </div>

            <button type="button" class="filter-dd-apply" @click="applyFilterDraft">
              <i class="fa-solid fa-check me-1"></i> {{ t('bookstore.apply') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: actions -->
      <nav class="bookstore-topbar-actions" aria-label="Book store actions">
        <router-link
          to="/bookstore/manage"
          class="bookstore-topbar-action"
          aria-label="Manage your books"
          title="My books"
        >
          <i class="fa-solid fa-list"></i>
        </router-link>
        <router-link
          to="/bookstore/upload"
          class="bookstore-topbar-action"
          aria-label="Sell a book"
          title="Sell a book"
        >
          <i class="fa-solid fa-upload"></i>
        </router-link>
        <router-link
          to="/bookstore/cart"
          class="bookstore-topbar-action bookstore-topbar-action--cart"
          aria-label="Shopping cart"
          title="Cart"
        >
          <i class="fa-solid fa-shopping-cart"></i>
          <span
            v-if="cartCount > 0"
            class="alert-dot bookstore-topbar-cart-badge"
            aria-label="Cart items"
          >{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </router-link>

        <!-- User menu (right-most): reuse the shared AppTopBarUserMenu for
             visual + functional parity with the main app topbar. -->
        <AppTopBarUserMenu
          v-if="isLoggedIn"
          :user-id="userId"
          :user-avatar="userAvatar"
          :user-display-name="userDisplayName"
          :user-stats="userStats"
          :user-main-links="userMainLinks"
          :user-library-links="userLibraryLinks"
          :user-setting-links="userSettingLinks"
          @logout="handleLogout"
        />
        <router-link
          v-else
          to="/login"
          class="bookstore-topbar-login"
          :aria-label="t('topbar.logIn')"
        >
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>{{ t('topbar.logIn') }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>
<style scoped src="../../assets/styles/bookstore.css"></style>
