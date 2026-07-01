<script setup>
import { computed } from 'vue'
import { useTheme } from '../../../composables/useTheme'

const { isDark, toggle } = useTheme()

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    default: '',
  },
  userDisplayName: {
    type: String,
    required: true,
  },
  userStats: {
    type: Object,
    required: true,
  },
  userMainLinks: {
    type: Array,
    default: () => [],
  },
  userLibraryLinks: {
    type: Array,
    default: () => [],
  },
  userSettingLinks: {
    type: Array,
    default: () => [],
  },
})

const avatarSrc = computed(() => props.userAvatar || DEFAULT_PROFILE_AVATAR)
const avatarAlt = computed(() => props.userDisplayName)

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}

defineEmits(['logout'])
</script>

<template>
  <details class="user-menu">
    <summary class="user-menu-trigger" aria-label="Open user menu" title="User menu">
      <router-link to="/account" class="user-avatar-link" aria-label="Go to account" @click.stop @keydown.enter.prevent>
        <img class="avatar avatar--sm user-avatar" :src="avatarSrc" :alt="avatarAlt" @error="handleAvatarError" />
      </router-link>
      <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
    </summary>
    <div class="user-menu-panel" role="menu" aria-label="User menu">
      <div class="user-hero">
        <router-link to="/account" class="user-hero-link" aria-label="Go to account">
          <img class="avatar avatar--lg user-avatar" :src="avatarSrc" :alt="avatarAlt" @error="handleAvatarError" />
        </router-link>
        <div class="user-hero-meta">
          <p class="mb-0 fw-bold">{{ props.userDisplayName }}</p>
          <p class="mb-0 small text-secondary">user_{{ props.userDisplayName.toLowerCase() }}</p>
          <div class="user-stats">
            <router-link
              :to="{ name: 'users-following', params: { id: props.userId } }"
              class="user-stat-link"
              aria-label="View following"
            >
              <strong>{{ props.userStats.following }}</strong> Following
            </router-link>
            <router-link
              :to="{ name: 'followers', params: { id: props.userId } }"
              class="user-stat-link"
              aria-label="View followers"
            >
              <strong>{{ props.userStats.followers }}</strong> Followers
            </router-link>
          </div>
        </div>
      </div>

      <div class="menu-group">
        <router-link
          v-for="item in props.userMainLinks"
          :key="item.label"
          :to="item.to"
          class="user-menu-item"
          role="menuitem"
        >
          {{ item.label }}
        </router-link>
      </div>

      <div class="menu-group">
        <router-link
          v-for="item in props.userLibraryLinks"
          :key="item.label"
          :to="item.to"
          class="user-menu-item"
          role="menuitem"
        >
          {{ item.label }}
        </router-link>
      </div>

      <p class="menu-label" role="presentation">Language</p>
      <button type="button" class="user-menu-item" role="menuitem">English</button>
      <button type="button" class="user-menu-item toggle-row" role="menuitem" aria-label="Toggle dark theme" @click="toggle">
        Dark Theme
        <span class="switch" :class="{ active: isDark }" aria-hidden="true">
          <span class="switch-knob"></span>
        </span>
      </button>

      <div class="menu-group">
        <router-link
          v-for="item in props.userSettingLinks"
          :key="item.label"
          :to="item.to"
          class="user-menu-item"
          role="menuitem"
        >
          {{ item.label }}
        </router-link>
      </div>

      <button type="button" class="user-menu-item danger" role="menuitem" @click="$emit('logout')">Log out</button>
    </div>
  </details>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu-trigger {
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: var(--surface);
  border-radius: 999px;
  padding: 0.2rem 0.42rem;
  cursor: pointer;
}

.user-avatar-link {
  text-decoration: none;
  display: inline-flex;
}

.user-hero-link {
  text-decoration: none;
  display: inline-flex;
}

.user-menu-trigger::-webkit-details-marker {
  display: none;
}

.user-menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  width: 216px;
  max-height: min(76vh, 498px);
  overflow-y: auto;
  scrollbar-width: none;
  padding: 0 0 1.2rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  z-index: 22;
}

.user-menu-panel::-webkit-scrollbar {
  display: none;
}

.user-hero {
  display: grid;
  justify-items: center;
  gap: 0.38rem;
  padding: 1rem 0.8rem 0.9rem;
}

.user-hero-meta {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
  justify-items: center;
  text-align: center;
}

.user-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.76rem;
  color: var(--muted);
}

.user-stat-link {
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
}

.user-stat-link:hover,
.user-stat-link:focus-visible {
  text-decoration: underline;
}

.menu-group {
  margin-top: 0.7rem;
}

.user-menu-item {
  text-decoration: none;
  border: none;
  background: transparent;
  color: var(--text);
  text-align: left;
  border-radius: 0;
  padding: 0 1rem;
  height: 40px;
  line-height: 40px;
  font-size: 0.9rem;
  width: 100%;
  display: flex;
  align-items: center;
}

.user-menu-item:hover,
.user-menu-item:focus-visible {
  background: var(--surface-alt);
}

.user-menu-item.danger {
  color: var(--danger);
}

.menu-label {
  margin: 0.7rem 0 0;
  padding: 0.28rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
}

.toggle-row {
  justify-content: space-between;
}

.switch {
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--muted);
  padding: 2px;
  display: inline-flex;
  align-items: center;
}

.switch-knob {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.switch.active {
  background: var(--accent);
}

.switch.active .switch-knob {
  transform: translateX(14px);
}
</style>
