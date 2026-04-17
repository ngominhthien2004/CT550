<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth.store'

const props = defineProps({
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

const authStore = useAuthStore()

const pixivStyleSections = computed(() => {
  if (Array.isArray(props.navItems) && props.navItems.length > 0) {
    const manageGroup = [
      { id: 'requests', label: 'Requests', to: '/messages', icon: 'fa-regular fa-comments' },
    ]

    if (authStore.user?.role === 'admin') {
      manageGroup.push({ id: 'admin', label: 'Admin management', to: '/admin', icon: 'fa-solid fa-shield-halved' })
    }

    return [
      props.navItems.slice(0, 1),
      [
        { id: 'illust', label: 'Illustrations', to: '/feed?type=illust', icon: 'fa-regular fa-image' },
        { id: 'manga', label: 'Manga', to: '/feed?type=manga', icon: 'fa-regular fa-square' },
        { id: 'novels', label: 'Novels', to: '/feed?type=novel', icon: 'fa-regular fa-rectangle-list' },
      ],
      [
        { id: 'following', label: 'Newest by followed', to: '/feed', icon: 'fa-solid fa-users' },
        { id: 'discovery', label: 'Discovery', to: '/feed', icon: 'fa-regular fa-compass' },
        { id: 'favorites', label: 'My Favorite', to: '/favorites', icon: 'fa-regular fa-heart' },
      ],
      [
        { id: 'rankings', label: 'Rankings', to: '/rankings', icon: 'fa-solid fa-crown' },
        { id: 'latest-all', label: 'Newest by all', to: '/feed', icon: 'fa-solid fa-wand-sparkles' },
        { id: 'contests', label: 'Contests', to: '/rankings', icon: 'fa-regular fa-bookmark' },
        ...manageGroup,
      ],
    ]
  }

  return []
})
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
      <ul class="nav-list">
        <li v-for="(group, groupIndex) in pixivStyleSections" :key="`group-${groupIndex}`" class="nav-group">
          <router-link v-for="item in group" :key="item.id" :to="item.to" class="nav-link-item">
            <i :class="item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
    <router-link to="/login" class="nav-ghost">Yeu cau dang nhap</router-link>
  </aside>
</template>

<style scoped>
.left-nav {
  width: 240px;
  padding: 0.85rem 0.65rem 1.2rem;
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
  gap: 0.82rem;
  padding: 0.05rem 0.35rem 1rem;
}

.brand {
  text-decoration: none;
  color: #1695f0;
  font-weight: 800;
  font-size: 3rem;
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
  display: block;
}

.nav-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav-group + .nav-group {
  margin-top: 1.25rem;
}

.nav-link-item {
  text-decoration: none;
  color: #374151;
  padding: 0.58rem 0.9rem;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.nav-link-item i {
  width: 1.15rem;
  text-align: center;
  color: #6b7280;
}

.nav-link-item:hover {
  background: #eceff5;
}

.nav-link-item.router-link-active {
  background: #dce8f7;
  color: #1f4fa3;
  font-weight: 700;
}

.nav-link-item.router-link-active i {
  color: #1f4fa3;
}

.nav-ghost {
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 1.1rem;
  width: 100%;
  border: 1px dashed #b8d8f5;
  background: #f3f8ff;
  color: #1d4ed8;
  border-radius: 10px;
  padding: 0.62rem 0.7rem;
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
