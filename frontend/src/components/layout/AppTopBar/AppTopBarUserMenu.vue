<script setup>
const props = defineProps({
  userInitial: {
    type: String,
    required: true,
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
  userBusinessLinks: {
    type: Array,
    default: () => [],
  },
  userSettingLinks: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['open-account', 'logout'])
</script>

<template>
  <details class="user-menu">
    <summary class="user-menu-trigger" aria-label="Open user menu" title="User menu">
      <a href="/account" class="user-avatar-link" aria-label="Go to account" @click.prevent.stop="$emit('open-account')">
        <span class="user-avatar">{{ props.userInitial }}</span>
      </a>
      <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
    </summary>
    <div class="user-menu-panel" role="menu" aria-label="User menu">
      <div class="user-hero">
        <span class="user-avatar large">{{ props.userInitial }}</span>
        <div class="user-hero-meta">
          <p class="mb-0 fw-bold">{{ props.userDisplayName }}</p>
          <p class="mb-0 small text-secondary">user_{{ props.userDisplayName.toLowerCase() }}</p>
          <div class="user-stats">
            <span><strong>{{ props.userStats.following }}</strong> Following</span>
            <span><strong>{{ props.userStats.followers }}</strong> Followers</span>
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

      <div class="menu-group">
        <router-link
          v-for="item in props.userBusinessLinks"
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
      <button type="button" class="user-menu-item toggle-row" role="menuitem" aria-label="Toggle dark theme">
        Dark Theme
        <span class="switch" aria-hidden="true">
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
  border: 1px solid #dce3ec;
  background: #fff;
  border-radius: 999px;
  padding: 0.2rem 0.42rem;
  cursor: pointer;
}

.user-avatar-link {
  text-decoration: none;
  display: inline-flex;
}

.user-menu-trigger::-webkit-details-marker {
  display: none;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #93c5fd, #60a5fa);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  width: 216px;
  max-height: min(76vh, 498px);
  overflow-y: auto;
  padding: 0 0 1.2rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.1);
  z-index: 22;
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

.user-avatar.large {
  width: 64px;
  height: 64px;
  font-size: 1rem;
}

.user-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.76rem;
  color: #6b7280;
}

.menu-group {
  margin-top: 0.7rem;
}

.user-menu-item {
  text-decoration: none;
  border: none;
  background: transparent;
  color: #1f2937;
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
  background: rgba(0, 0, 0, 0.05);
}

.user-menu-item.danger {
  color: #dc2626;
}

.menu-label {
  margin: 0.7rem 0 0;
  padding: 0.28rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #858585;
}

.toggle-row {
  justify-content: space-between;
}

.switch {
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: #d1d5db;
  padding: 2px;
  display: inline-flex;
  align-items: center;
}

.switch-knob {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.24);
}
</style>
