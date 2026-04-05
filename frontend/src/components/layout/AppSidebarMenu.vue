<script setup>
defineProps({
  navItems: {
    type: Array,
    default: () => [],
  },
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
  isNavCollapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close-sidebar'])
</script>

<template>
  <aside class="left-nav" :class="{ collapsed: isNavCollapsed }">
    <div class="sidebar-head">
      <button type="button" class="menu-toggle" aria-label="Close menu" @click="$emit('close-sidebar')">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <router-link to="/" class="brand">{{ siteName }}</router-link>
    </div>

    <nav>
      <router-link v-for="item in navItems" :key="item.id" :to="item.to" class="nav-link-item">
        <i :class="item.icon" aria-hidden="true"></i>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
    <router-link to="/login" class="nav-ghost">Yeu cau dang nhap</router-link>
  </aside>
</template>

<style scoped>
.left-nav {
  width: 240px;
  padding: 0.85rem 0.65rem;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow: auto;
  transition: transform 0.22s ease;
  background: #f4f6fa;
  border-right: 1px solid var(--line);
  transform: translateX(0%);
}

.left-nav.collapsed {
  transform: translateX(-100%);
}

.sidebar-head {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.05rem 0.35rem 0.8rem;
}

.brand {
  text-decoration: none;
  color: #1695f0;
  font-weight: 800;
  font-size: 2.7rem;
  line-height: 1;
  letter-spacing: -0.03em;
}

.menu-toggle {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  border: 1px solid #d7dfea;
  background: #fff;
  color: #7a808c;
}

.left-nav nav {
  display: grid;
  gap: 0.3rem;
}

.nav-link-item {
  text-decoration: none;
  color: #334155;
  padding: 0.72rem 0.65rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.nav-ghost {
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 1rem;
  width: 100%;
  border: 1px dashed #93c5fd;
  background: #f0f7ff;
  color: #1d4ed8;
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 920px) {
  .left-nav {
    width: min(88vw, 290px);
  }

  .left-nav.collapsed {
    transform: translateX(-102%);
  }

  .brand {
    font-size: 2.4rem;
  }
}
</style>
