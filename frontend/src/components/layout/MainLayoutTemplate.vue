<script setup>
import HomeTopNav from '../home/HomeTopNav.vue'

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
  <div class="app-layout" :class="{ 'nav-collapsed': isNavCollapsed }">
    <aside class="left-nav page-block" :class="{ collapsed: isNavCollapsed }">
      <nav>
        <router-link v-for="item in navItems" :key="item.id" :to="item.to" class="nav-link-item">
          <i :class="item.icon" aria-hidden="true"></i>
          <span v-show="!isNavCollapsed">{{ item.label }}</span>
        </router-link>
      </nav>
      <button v-show="!isNavCollapsed" type="button" class="nav-ghost">Yeu cau dang nhap</button>
    </aside>

    <section class="main-pane">
      <HomeTopNav :site-name="siteName" @toggle-sidebar="$emit('toggle-sidebar')" />
      <slot />
    </section>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 0.8rem;
}

.app-layout.nav-collapsed {
  grid-template-columns: 76px minmax(0, 1fr);
}

.left-nav {
  padding: 1rem 0.65rem;
  position: sticky;
  top: 0.8rem;
  height: calc(100vh - 1.6rem);
  overflow: auto;
  transition: width 0.2s ease, padding 0.2s ease;
}

.left-nav.collapsed {
  width: 76px;
  padding-inline: 0.4rem;
}

.left-nav nav {
  display: grid;
  gap: 0.3rem;
}

.nav-link-item {
  text-decoration: none;
  color: #334155;
  padding: 0.62rem 0.65rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.nav-link-item i {
  width: 1rem;
  text-align: center;
}

.nav-link-item:hover {
  background: #edf5ff;
}

.nav-link-item.router-link-active {
  background: #e3f0ff;
  color: #0f4ca8;
}

.left-nav.collapsed .nav-link-item {
  justify-content: center;
}

.nav-ghost {
  margin-top: 0.8rem;
  width: 100%;
  border: 1px dashed #93c5fd;
  background: #f0f7ff;
  color: #1d4ed8;
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.main-pane {
  padding: 0.55rem 1rem 1rem;
  display: grid;
  gap: 0.9rem;
}

@media (max-width: 1200px) {
  .app-layout {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  .app-layout.nav-collapsed {
    grid-template-columns: 70px minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .left-nav {
    height: auto;
    position: static;
    width: 100%;
  }

  .left-nav.collapsed {
    width: 100%;
    padding-inline: 0.65rem;
  }
}
</style>
