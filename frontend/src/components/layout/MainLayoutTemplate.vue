<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import AppSidebarMenu from './AppSidebarMenu.vue'
import AppTopBar from './AppTopBar.vue'

const SIDEBAR_Z_INDEX = 1040

const props = defineProps({
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
  isNavCollapsed: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toggle-sidebar'])

const isSidebarCompact = ref(false)

function toggleCompact() {
  isSidebarCompact.value = !isSidebarCompact.value
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  () => props.isNavCollapsed,
  (isCollapsed) => {
    document.body.style.overflow = isCollapsed ? '' : 'hidden'
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="layout-root">
    <div class="app-layout">
      <div v-if="!props.isNavCollapsed" class="sidebar-backdrop" :style="{ zIndex: SIDEBAR_Z_INDEX - 1 }" @click="emit('toggle-sidebar')" @keydown.enter.prevent="emit('toggle-sidebar')" @keydown.space.prevent="emit('toggle-sidebar')" tabindex="0" role="button"></div>

      <AppSidebarMenu
        :site-name="siteName"
        :is-nav-collapsed="props.isNavCollapsed"
        :sidebar-compact="isSidebarCompact"
        :style="{ zIndex: SIDEBAR_Z_INDEX }"
        @close-sidebar="emit('toggle-sidebar')"
        @toggle-compact="toggleCompact"
      />

      <section class="main-pane" :class="{
        'sidebar-compact-active': !props.isNavCollapsed && isSidebarCompact,
        'sidebar-hidden': props.isNavCollapsed
      }">
        <AppTopBar :site-name="siteName" @toggle-sidebar="emit('toggle-sidebar')" />
        <div class="main-content">
          <slot />
        </div>
      </section>

    </div>

    <Teleport to="body">
      <button type="button"
        class="back-to-top"
        @click="scrollToTop"
        aria-label="Back to top"
      >
        <i class="fa-solid fa-arrow-up"></i>
      </button>

      <router-link to="/chat"
        class="ai-chat-fab"
        aria-label="AI Chat"
      >
        <i class="fa-solid fa-robot"></i>
      </router-link>
    </Teleport>
  </div>
</template>

<style scoped>
.layout-root {
  display: contents;
}

.app-layout {
  display: block;
  position: relative;
  min-height: 100vh;
}

.main-pane {
  padding: 0.35rem 40px 1rem;
  display: grid;
  gap: 0;
  /* transition removed — sidebar is fixed, no layout animation needed */
  margin-left: 240px;
}

.main-pane.sidebar-compact-active {
  margin-left: 68px;
}

.main-pane.sidebar-hidden {
  margin-left: 0;
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
    margin-left: 0;
    padding-inline: 0.65rem;
  }

  .main-pane.sidebar-compact-active {
    margin-left: 0;
  }

  .main-pane.sidebar-hidden {
    margin-left: 0;
  }

  .main-content {
    margin: 0 18px;
    gap: 0.6rem;
  }
}

</style>

<style>
/* Non-scoped styles for teleported FABs — rendered at <body> level */
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

.ai-chat-fab {
  position: fixed;
  bottom: 2rem;
  right: 6rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  z-index: 1050;
  transition: opacity 0.25s ease, transform 0.25s ease;
  text-decoration: none;
}

.ai-chat-fab:hover {
  transform: translateY(-2px);
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
}
</style>
