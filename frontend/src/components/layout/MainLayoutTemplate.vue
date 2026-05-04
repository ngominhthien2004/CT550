<script setup>
import { onBeforeUnmount, watch } from 'vue'
import AppSidebarMenu from './AppSidebarMenu.vue'
import AppTopBar from './AppTopBar.vue'

const SIDEBAR_Z_INDEX = 1040

const props = defineProps({
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
      <div class="main-content">
        <slot />
      </div>
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
</style>
