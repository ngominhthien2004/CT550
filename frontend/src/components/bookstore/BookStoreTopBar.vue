<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '@/stores/book.store.js'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

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

// Reactive cart count pulled from the Pinia store. The store already exposes
// `cartItemCount` as a derived getter; re-read it through `state` so the
// template reacts when `fetchCart` / `addBookToCart` / `removeFromCart` update it.
const cartCount = computed(() => bookStore.cartItemCount)

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

      <!-- Center: search -->
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
      </nav>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
