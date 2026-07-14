<script setup>
import { ref, onMounted, watch } from 'vue'
import BookStoreTopBar from './BookStoreTopBar.vue'
import { useChatStore } from '@/stores/chat.store.js'

const chatStore = useChatStore()

// Sidebar collapsed state. Persists to localStorage so the user's preference
// sticks across reloads and route changes. Default is expanded (false) so
// first-time visitors see the full nav.
const SIDEBAR_KEY = 'bookstore-sidebar-collapsed'
const sidebarCollapsed = ref(false)

function readSavedCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

onMounted(() => {
  sidebarCollapsed.value = readSavedCollapsed()
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Persist preference whenever it changes.
watch(sidebarCollapsed, (collapsed) => {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  } catch {
    /* localStorage may be disabled (private mode, etc.) — ignore. */
  }
})
</script>

<template>
  <div class="bookstore-layout-root">
    <BookStoreTopBar />

    <div class="bookstore-layout-body">
      <aside
        class="bookstore-sidebar"
        :class="{ 'is-collapsed': sidebarCollapsed }"
        :aria-label="'Book store navigation'"
      >
        <button
          type="button"
          class="bookstore-sidebar-toggle"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleSidebar"
        >
          <i :class="sidebarCollapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"></i>
          <span v-if="!sidebarCollapsed" class="bookstore-sidebar-toggle-label">Collapse</span>
        </button>

        <nav>
          <ul class="bookstore-sidebar-nav">
            <li>
              <router-link
                to="/bookstore"
                class="bookstore-sidebar-link"
                exact-active-class="bookstore-sidebar-link--active"
              >
                <i class="fa-solid fa-house" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">Home</span>
              </router-link>
            </li>
            <li>
              <router-link to="/bookstore?sort=newest" class="bookstore-sidebar-link">
                <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">Newest</span>
              </router-link>
            </li>
            <li>
              <router-link to="/bookstore?sort=popular" class="bookstore-sidebar-link">
                <i class="fa-solid fa-fire" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">Popular</span>
              </router-link>
            </li>

            <li><hr class="bookstore-sidebar-divider" /></li>

            <li>
              <router-link to="/bookstore/manage" class="bookstore-sidebar-link">
                <i class="fa-solid fa-book" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">My Books</span>
              </router-link>
            </li>
            <li>
              <router-link to="/bookstore/upload" class="bookstore-sidebar-link">
                <i class="fa-solid fa-upload" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">Sell a book</span>
              </router-link>
            </li>
            <li>
              <router-link to="/bookstore/cart" class="bookstore-sidebar-link">
                <i class="fa-solid fa-shopping-cart" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">Cart</span>
              </router-link>
            </li>
            <li>
              <router-link to="/bookstore/orders" class="bookstore-sidebar-link">
                <i class="fa-solid fa-receipt" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">My Orders</span>
              </router-link>
            </li>

            <li><hr class="bookstore-sidebar-divider" /></li>

            <li>
              <router-link to="/" class="bookstore-sidebar-link">
                <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                <span class="bookstore-sidebar-text">Back to IlluWrl</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="bookstore-main">
        <slot />
      </main>
    </div>

    <!-- Back-to-top + AI chat FABs (teleport to body so they sit above
         everything, regardless of the layout's stacking context). -->
    <Teleport to="body">
      <button
        type="button"
        class="bookstore-back-to-top"
        aria-label="Back to top"
        @click="scrollToTop"
      >
        <i class="fa-solid fa-arrow-up"></i>
      </button>

      <button
        type="button"
        class="bookstore-ai-chat-fab"
        aria-label="AI Chat"
        @click="chatStore.toggleBubble()"
      >
        <i class="fa-solid fa-robot"></i>
      </button>
    </Teleport>
  </div>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
<style scoped>
.bookstore-layout-root {
  display: block;
  min-height: 100vh;
  background: var(--bg);
}

.bookstore-layout-body {
  display: flex;
  /* The topbar is sticky and lives in normal flow, so no margin-top offset
     is needed here. */
  min-height: calc(100vh - 60px);
}

.bookstore-main {
  flex: 1;
  min-width: 0;
}
</style>

<style>
/* Non-scoped styles for teleported FABs — rendered at <body> level.
   Mirror the styling used by MainLayoutTemplate's back-to-top / AI fab
   so the visual stays consistent across the app. */
.bookstore-back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--line);
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.15));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  z-index: 1050;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.bookstore-back-to-top:hover {
  background: var(--accent);
  color: #fff;
  transform: translateY(-2px);
}

.bookstore-ai-chat-fab {
  position: fixed;
  bottom: 2rem;
  right: 6rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #0078d4);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  z-index: 1050;
  transition: opacity 0.25s ease, transform 0.25s ease;
  text-decoration: none;
}

.bookstore-ai-chat-fab:hover {
  transform: translateY(-2px);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 150, 250, 0.5);
}
</style>
