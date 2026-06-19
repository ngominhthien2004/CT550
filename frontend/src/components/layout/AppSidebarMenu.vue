<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { navItems } from '../../constants/navigation.js'

const props = defineProps({
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
  isNavCollapsed: {
    type: Boolean,
    default: false,
  },
  sidebarCompact: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close-sidebar', 'toggle-compact'])

/* ── Sidebar group collapse state ── */
const expandedGroups = ref(loadExpandedState())

const groupExpandedState = computed(() =>
  illuWrlStyleSections.value.map((_, index) => isGroupExpanded(index))
)

function loadExpandedState() {
  try {
    const saved = localStorage.getItem('sidebar-collapsed-groups')
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed
    }
  } catch { /* ignore corrupt data */ }
  // Default: all groups expanded (indices 1, 2, 3 — 0 has no label)
  return { 1: true, 2: true, 3: true }
}

function saveExpandedState() {
  localStorage.setItem('sidebar-collapsed-groups', JSON.stringify(expandedGroups.value))
}

function toggleGroup(index) {
  expandedGroups.value[index] = !expandedGroups.value[index]
  saveExpandedState()
}

function isGroupExpanded(index) {
  // Group 0 (Home) is always expanded — no collapse for it
  if (index === 0) return true
  return expandedGroups.value[index] !== false
}

const authStore = useAuthStore()
const { logout } = useAuthStore()

const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'
function onAvatarError(e) {
  if (e.target?.src !== DEFAULT_AVATAR) {
    e.target.src = DEFAULT_AVATAR
  }
}

const illuWrlStyleSections = computed(() => {
  const manageGroup = [
    { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-gauge-high' },
    { id: 'requests', label: 'Requests', to: '/requests/manage', icon: 'fa-regular fa-comments' },
    { id: 'history', label: 'Browsing history', to: '/history', icon: 'fa-regular fa-clock' },
    { id: 'my-reports', label: 'My Reports', to: '/my-reports', icon: 'fa-regular fa-flag' },
    ...(authStore.user?.role === 'admin'
      ? [{ id: 'admin', label: 'Admin management', to: '/admin', icon: 'fa-solid fa-shield-halved' }]
      : []),
  ]

  return [
    { label: '', items: navItems.slice(0, 1) },
    {
      label: 'Content',
      items: [
        { id: 'illust', label: 'Illustrations', to: '/illustrations', icon: 'fa-regular fa-image' },
        { id: 'manga', label: 'Manga', to: '/manga', icon: 'fa-regular fa-square' },
        { id: 'novels', label: 'Novels', to: '/novels', icon: 'fa-regular fa-rectangle-list' },
      ],
    },
    {
      label: 'Explore',
      items: [
        { id: 'following', label: 'Following', to: '/newest_by_followed', icon: 'fa-solid fa-users' },
        { id: 'discovery', label: 'Discovery', to: '/discovery', icon: 'fa-regular fa-compass' },
        { id: 'favorites', label: 'My Favorite', to: '/favorites', icon: 'fa-regular fa-heart' },
        { id: 'bookmarks', label: 'Bookmarks', to: '/bookmarks', icon: 'fa-regular fa-bookmark' },
      ],
    },
    {
      label: 'Utilities',
      items: [
        { id: 'rankings', label: 'Rankings', to: '/rankings', icon: 'fa-solid fa-crown' },
        { id: 'latest-all', label: 'Newest by all', to: '/newest_by_all', icon: 'fa-solid fa-wand-sparkles' },
        ...manageGroup,
        { id: 'ai-chat', label: 'AI Chat', to: '/chat', icon: 'fa-solid fa-robot' },
        { id: 'draw', label: 'Drawing', to: '/draw', icon: 'fa-solid fa-pen-nib' },
      ],
    },
  ]
})
</script>

<template>
  <aside class="left-nav" :class="{ collapsed: isNavCollapsed, 'icon-only': sidebarCompact }">
    <div class="sidebar-head">
      <button type="button" class="menu-toggle" aria-label="Close menu" @click="$emit('close-sidebar')">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <router-link to="/" class="brand">
        <span class="brand-full">{{ siteName }}</span>
        <span class="brand-short">IW</span>
      </router-link>
      <button
        type="button"
        class="compact-toggle"
        :aria-label="sidebarCompact ? 'Expand sidebar' : 'Collapse to icons'"
        :title="sidebarCompact ? 'Expand sidebar' : 'Collapse to icons'"
        @click="$emit('toggle-compact')"
      >
        <i :class="sidebarCompact ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'" aria-hidden="true"></i>
      </button>
    </div>

    <nav>
      <ul class="nav-list">
        <li v-for="(group, groupIndex) in illuWrlStyleSections" :key="`group-${groupIndex}`" class="nav-group">
          <!-- Header row (only for groups with a label) -->
          <div
            v-if="group.label"
            class="nav-group-header"
            @click="toggleGroup(groupIndex)"
            role="button"
            :aria-expanded="groupExpandedState[groupIndex]"
            tabindex="0"
            @keydown.enter="toggleGroup(groupIndex)"
            @keydown.space.prevent="toggleGroup(groupIndex)"
          >
            <span class="nav-group-label">{{ group.label }}</span>
            <i
              class="fa-solid fa-chevron-down nav-group-chevron"
              :class="{ collapsed: !groupExpandedState[groupIndex] }"
              :style="{ display: sidebarCompact ? 'none' : '' }"
              aria-hidden="true"
            ></i>
          </div>

          <!-- Items container -->
          <div class="nav-group-items" v-show="groupExpandedState[groupIndex]">
            <router-link
              v-for="item in group.items"
              :key="item.id"
              :to="item.to"
              class="nav-link-item"
              :title="sidebarCompact ? item.label : undefined"
            >
              <i :class="item.icon" aria-hidden="true"></i>
              <span class="nav-item-label">{{ item.label }}</span>
            </router-link>
          </div>
        </li>
      </ul>
    </nav>

    <router-link v-if="!authStore.user" to="/login" class="nav-ghost">Log in to explore more</router-link>

    <div v-if="authStore.user" class="sidebar-user">
      <router-link to="/account" class="sidebar-user-link" :title="sidebarCompact ? authStore.user.displayName || authStore.user.username : undefined">
        <img :src="authStore.user.avatar || DEFAULT_AVATAR" alt="" class="sidebar-avatar" @error="onAvatarError" />
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">{{ authStore.user.displayName || authStore.user.username }}</span>
          <span class="sidebar-user-id">@{{ authStore.user.username }}</span>
        </div>
      </router-link>
      <button class="sidebar-logout-btn" @click="logout" title="Log out">
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
  transition: transform 0.22s ease, width 0.22s ease;
  background: var(--surface-alt);
  border-right: 1px solid var(--line);
  transform: translateX(0%);
  display: flex;
  flex-direction: column;
}

/* ── Custom scrollbar ── */
.left-nav::-webkit-scrollbar {
  width: 5px;
}

.left-nav::-webkit-scrollbar-track {
  background: transparent;
}

.left-nav::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 999px;
}

.left-nav::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.left-nav.collapsed {
  transform: translateX(-100%);
}

/* ── Icon-only mode ── */
.left-nav.icon-only {
  width: 68px;
}

.left-nav.icon-only .brand-full {
  display: none;
}

.left-nav:not(.icon-only) .brand-short {
  display: none;
}

.left-nav.icon-only .nav-item-label,
.left-nav.icon-only .nav-group-label,
.left-nav.icon-only .sidebar-user-info,
.left-nav.icon-only .nav-ghost {
  display: none;
}

.left-nav.icon-only .nav-link-item {
  justify-content: center;
  padding: 0.58rem 0;
  gap: 0;
}

.left-nav.icon-only .nav-link-item i {
  width: auto;
  font-size: 1.15rem;
}

.left-nav.icon-only .nav-link-item.router-link-active {
  padding-left: 0;
  border-left: none;
  border-right: 3px solid var(--accent);
}

.left-nav.icon-only .sidebar-head {
  justify-content: center;
  gap: 0.5rem;
}

.left-nav.icon-only .menu-toggle {
  display: none;
}

.left-nav.icon-only .compact-toggle {
  position: absolute;
  right: -0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  z-index: 1;
  transition: background 0.18s ease, color 0.18s ease;
}

.left-nav.icon-only .compact-toggle:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.left-nav.icon-only .sidebar-user-link {
  justify-content: center;
  padding: 0.4rem 0;
}

.left-nav.icon-only .sidebar-user {
  justify-content: center;
}

.left-nav.icon-only .sidebar-logout-btn {
  display: none;
}

.left-nav.icon-only .nav-group-header {
  justify-content: center;
  padding: 0.3rem 0 0.4rem;
}

.left-nav.icon-only .nav-group-header .nav-group-chevron {
  display: none !important;
}

/* ── End icon-only mode ── */

.sidebar-head {
  display: flex;
  align-items: center;
  gap: 0.82rem;
  padding: 0.05rem 0.35rem 1rem;
  position: relative;
}

.brand {
  text-decoration: none;
  color: var(--accent);
  font-weight: 800;
  font-size: 1.75rem;
  line-height: 1;
  letter-spacing: -0.03em;
}

.brand-short {
  font-size: 1.3rem;
  letter-spacing: 0;
}

.menu-toggle {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease;
}

.menu-toggle:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.compact-toggle {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  margin-left: auto;
  transition: background 0.18s ease, color 0.18s ease;
}

.compact-toggle:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--accent);
  border-color: var(--accent);
}

.left-nav nav {
  flex: 1;
  overflow-y: auto;
}

.left-nav nav::-webkit-scrollbar {
  width: 5px;
}

.left-nav nav::-webkit-scrollbar-track {
  background: transparent;
}

.left-nav nav::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 999px;
}

.left-nav nav::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
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
  transition: background 0.18s ease, color 0.18s ease;
}

.nav-link-item i {
  width: 1.15rem;
  text-align: center;
  color: var(--muted);
  transition: color 0.18s ease;
}

.nav-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 0.3rem 0.9rem 0.4rem;
  border-radius: 8px;
}

.nav-group-header:hover {
  opacity: 0.8;
}

.nav-group-header .nav-group-label {
  padding: 0;
}

.nav-group-chevron {
  font-size: 0.65rem;
  color: var(--muted);
  transition: transform 0.2s ease;
}

.nav-group-chevron.collapsed {
  transform: rotate(-90deg);
}

.nav-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  display: block;
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

  .left-nav:not(.icon-only) .brand {
    font-size: 2.4rem;
  }

  .left-nav.icon-only {
    width: 62px;
  }

  .left-nav.icon-only .compact-toggle {
    display: none;
  }
}
</style>
