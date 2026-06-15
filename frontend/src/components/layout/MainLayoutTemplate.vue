<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import AppSidebarMenu from './AppSidebarMenu.vue'
import AppTopBar from './AppTopBar.vue'

const SIDEBAR_Z_INDEX = 1040

const props = defineProps({
  navItems: {
    type: Array,
    default: () => [],
  },
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
})

const isNavCollapsed = ref(false)
const showBackToTop = ref(false)
let scrollHandler = null

function toggleSidebar() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  isNavCollapsed,
  (isCollapsed) => {
    document.body.style.overflow = isCollapsed ? '' : 'hidden'
  },
  { immediate: true },
)

onMounted(() => {
  scrollHandler = () => {
    showBackToTop.value = window.scrollY > 300
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<template>
  <div class="app-layout">
    <div v-if="!isNavCollapsed" class="sidebar-backdrop" :style="{ zIndex: SIDEBAR_Z_INDEX - 1 }" @click="toggleSidebar"></div>

    <AppSidebarMenu
      :nav-items="navItems"
      :site-name="siteName"
      :is-nav-collapsed="isNavCollapsed"
      :style="{ zIndex: SIDEBAR_Z_INDEX }"
      @close-sidebar="toggleSidebar"
    />

    <section class="main-pane">
      <AppTopBar :site-name="siteName" @toggle-sidebar="toggleSidebar" />
      <div class="main-content">
        <slot />
      </div>
    </section>

    <button
      v-show="showBackToTop"
      class="back-to-top"
      @click="scrollToTop"
      aria-label="Back to top"
    >
      <i class="fa-solid fa-arrow-up"></i>
    </button>
  </div>
</template>

<style scoped>
.app-layout {
  display: block;
  position: relative;
  min-height: 100vh;
}

.main-pane {
  padding: 0.35rem 40px 1rem;
  display: grid;
  gap: 0;
}

.main-content {
  margin: 0 72px;
  display: grid;
  gap: 0.7rem;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(1px);
}

@media (max-width: 1200px) {
  .main-pane {
    padding-inline: 0.85rem;
  }

  .main-content {
    margin: 0 40px;
  }
}

@media (max-width: 920px) {
  .main-pane {
    padding-inline: 0.65rem;
  }

  .main-content {
    margin: 0 18px;
    gap: 0.6rem;
  }
}

.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--line);
  box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.15));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  z-index: 1050;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.back-to-top:hover {
  background: var(--accent);
  color: #fff;
  transform: translateY(-2px);
}
</style>
