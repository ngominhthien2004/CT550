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
const { logout } = useAuthStore()

const illuWrlStyleSections = computed(() => {
  if (Array.isArray(props.navItems) && props.navItems.length > 0) {
    const manageGroup = [
      { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-gauge-high' },
      { id: 'requests', label: 'Requests', to: '/requests/manage', icon: 'fa-regular fa-comments' },
      { id: 'history', label: 'Browsing history', to: '/history', icon: 'fa-regular fa-clock' },
      { id: 'my-reports', label: 'My Reports', to: '/my-reports', icon: 'fa-regular fa-flag' },
    ]

    if (authStore.user?.role === 'admin') {
      manageGroup.push({ id: 'admin', label: 'Admin management', to: '/admin', icon: 'fa-solid fa-shield-halved' })
    }

    return [
      { label: '', items: props.navItems.slice(0, 1) },
      {
        label: 'Nội dung',
        items: [
          { id: 'illust', label: 'Illustrations', to: '/illustrations', icon: 'fa-regular fa-image' },
          { id: 'manga', label: 'Manga', to: '/manga', icon: 'fa-regular fa-square' },
          { id: 'novels', label: 'Novels', to: '/novels', icon: 'fa-regular fa-rectangle-list' },
        ],
      },
      {
        label: 'Khám phá',
        items: [
          { id: 'following', label: 'Newest by followed', to: '/newest_by_followed', icon: 'fa-solid fa-users' },
          { id: 'discovery', label: 'Discovery', to: '/discovery', icon: 'fa-regular fa-compass' },
          { id: 'favorites', label: 'My Favorite', to: '/favorites', icon: 'fa-regular fa-heart' },
          { id: 'bookmarks', label: 'Bookmarks', to: '/bookmarks', icon: 'fa-regular fa-bookmark' },
        ],
      },
      {
        label: 'Tiện ích',
        items: [
          { id: 'rankings', label: 'Rankings', to: '/rankings', icon: 'fa-solid fa-crown' },
          { id: 'latest-all', label: 'Newest by all', to: '/newest_by_all', icon: 'fa-solid fa-wand-sparkles' },
          ...manageGroup,
          { id: 'ai-chat', label: 'AI Chat', to: '/chat', icon: 'fa-solid fa-robot' },
          { id: 'draw', label: 'Vẽ tranh', to: '/draw', icon: 'fa-solid fa-pen-nib' },
        ],
      },
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
        <li v-for="(group, groupIndex) in illuWrlStyleSections" :key="`group-${groupIndex}`" class="nav-group">
          <span v-if="group.label" class="nav-group-label">{{ group.label }}</span>
          <router-link v-for="item in group.items" :key="item.id" :to="item.to" class="nav-link-item">
            <i :class="item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <router-link v-if="!authStore.user" to="/login" class="nav-ghost">Đăng nhập để khám phá thêm</router-link>

    <div v-if="authStore.user" class="sidebar-user">
      <router-link to="/account" class="sidebar-user-link">
        <img :src="authStore.user.avatar || '/default-avatar.png'" alt="" class="sidebar-avatar" />
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">{{ authStore.user.displayName || authStore.user.username }}</span>
          <span class="sidebar-user-id">@{{ authStore.user.username }}</span>
        </div>
      </router-link>
      <button class="sidebar-logout-btn" @click="logout" title="Đăng xuất">
        <i class="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>
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
  background: var(--surface-alt);
  border-right: 1px solid var(--line);
  transform: translateX(0%);
  display: flex;
  flex-direction: column;
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
  color: var(--accent);
  font-weight: 800;
  font-size: 1.75rem;
  line-height: 1;
  letter-spacing: -0.03em;
}

.menu-toggle {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
}

.left-nav nav {
  flex: 1;
  overflow-y: auto;
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
  color: var(--text);
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
  color: var(--muted);
}

.nav-group-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  padding: 0.3rem 0.9rem 0.4rem;
}

.nav-link-item:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.nav-link-item.router-link-active {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-left: 3px solid var(--accent);
  padding-left: calc(0.9rem - 3px);
  color: var(--accent);
  font-weight: 700;
}

.nav-link-item.router-link-active i {
  color: var(--accent);
}

.nav-ghost {
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 1.1rem;
  width: 100%;
  border: 1px dashed var(--accent);
  background: var(--surface-alt);
  color: var(--accent);
  border-radius: 10px;
  padding: 0.62rem 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.sidebar-user {
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-user-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.4rem;
  border-radius: 10px;
  transition: background 0.18s ease;
}

.sidebar-user-link:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.sidebar-avatar {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface);
}

.sidebar-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar-user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-user-id {
  font-size: 0.72rem;
  color: var(--muted);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-logout-btn {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease, color 0.18s ease;
}

.sidebar-logout-btn:hover {
  background: color-mix(in srgb, var(--danger, #ef4444) 10%, transparent);
  color: var(--danger, #ef4444);
  border-color: var(--danger, #ef4444);
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
