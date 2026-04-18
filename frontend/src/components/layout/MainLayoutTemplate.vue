<script setup>
import AppSidebarMenu from './AppSidebarMenu.vue'
import AppTopBar from './AppTopBar.vue'

const SIDEBAR_Z_INDEX = 1040

defineProps({
  navItems: {
    type: Array,
    default: () => [],
  },
  isNavCollapsed: {
    type: Boolean,
    default: false,
  },
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
})

defineEmits(['toggle-sidebar'])
</script>

<template>
  <div class="app-layout">
    <div v-if="!isNavCollapsed" class="sidebar-backdrop" :style="{ zIndex: SIDEBAR_Z_INDEX - 1 }" @click="$emit('toggle-sidebar')"></div>

    <AppSidebarMenu
      :nav-items="navItems"
      :site-name="siteName"
      :is-nav-collapsed="isNavCollapsed"
      :style="{ zIndex: SIDEBAR_Z_INDEX }"
      @close-sidebar="$emit('toggle-sidebar')"
    />

    <section class="main-pane">
      <AppTopBar :site-name="siteName" @toggle-sidebar="$emit('toggle-sidebar')" />
      <slot />
    </section>
  </div>
</template>

<style scoped>
.app-layout {
  display: block;
  position: relative;
  min-height: 100vh;
}

.main-pane {
  padding: 0.55rem 72px 1rem;
  display: grid;
  gap: 0.9rem;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(1px);
}

@media (max-width: 1200px) {
  .main-pane {
    padding-inline: 0.8rem;
  }
}

@media (max-width: 920px) {
  .main-pane {
    padding-inline: 0.65rem;
  }
}
</style>
