<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'
import { useBookStore } from '@/stores/book.store.js'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const isSearchFocused = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

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

// User-menu data. Pulls from the global auth store so the menu reflects the
// current session (login, logout, or page reload).
const user = computed(() => authStore.user)
const isLoggedIn = computed(() => Boolean(authStore.isAuthenticated))
const userInitial = computed(() => {
  const name = user.value?.username || user.value?.displayName || ''
  return name ? name.charAt(0).toUpperCase() : '?'
})

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

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function handleClickOutside(event) {
  if (!userMenuOpen.value) return
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    userMenuOpen.value = false
  }
}

function handleLogout() {
  userMenuOpen.value = false
  authStore.logout()
  router.push('/')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
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

        <!-- User menu (right-most) -->
        <div ref="userMenuRef" class="bookstore-topbar-user">
          <button
            type="button"
            class="bookstore-topbar-user-trigger"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            :aria-label="isLoggedIn ? `Open user menu for ${user?.username || 'user'}` : 'Open account menu'"
            @click.stop="toggleUserMenu"
          >
            <img
              v-if="user?.avatar"
              :src="user.avatar"
              :alt="user?.username || 'user avatar'"
              class="bookstore-topbar-user-avatar-img"
            />
            <span
              v-else
              class="bookstore-topbar-user-avatar-fallback"
              aria-hidden="true"
            >{{ userInitial }}</span>
            <i v-if="isLoggedIn" class="fa-solid fa-chevron-down"></i>
          </button>

          <div v-if="userMenuOpen" class="bookstore-topbar-user-menu" role="menu">
            <template v-if="isLoggedIn">
              <div class="bookstore-topbar-user-info">
                <strong>{{ user?.displayName || user?.username }}</strong>
                <span>@{{ user?.username }}</span>
              </div>

              <router-link
                to="/account"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="closeUserMenu"
              >
                <i class="fa-solid fa-user" aria-hidden="true"></i>
                Account
              </router-link>

              <router-link
                to="/bookstore/manage"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="closeUserMenu"
              >
                <i class="fa-solid fa-book" aria-hidden="true"></i>
                My Books
              </router-link>

              <router-link
                to="/bookstore/orders"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="closeUserMenu"
              >
                <i class="fa-solid fa-receipt" aria-hidden="true"></i>
                Orders
              </router-link>

              <router-link
                to="/settings"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="closeUserMenu"
              >
                <i class="fa-solid fa-gear" aria-hidden="true"></i>
                Settings
              </router-link>

              <hr />

              <button
                type="button"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="handleLogout"
              >
                <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                Log out
              </button>
            </template>

            <template v-else>
              <router-link
                to="/login"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="closeUserMenu"
              >
                <i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i>
                Log in
              </router-link>
              <router-link
                to="/signup"
                class="bookstore-topbar-user-action"
                role="menuitem"
                @click="closeUserMenu"
              >
                <i class="fa-solid fa-user-plus" aria-hidden="true"></i>
                Sign up
              </router-link>
            </template>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
