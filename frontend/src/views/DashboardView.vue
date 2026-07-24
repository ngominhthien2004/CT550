<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { CreatorDashboardTabs } from '@/components/dashboard'

import { useAuthStore } from '../stores/auth.store'

const isNavCollapsed = ref(true)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()
const user = computed(() => authStore.user)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function handleTabChange(tab) {
  if (tab === 'home') {
    router.push({ name: 'dashboard-home' })
  } else if (tab === 'works') {
    router.push({ name: 'dashboard-works' })
  } else if (tab === 'series') {
    router.push({ name: 'dashboard-series' })
  } else if (tab === 'reactions') {
    router.push({ name: 'dashboard-reactions' })
  } else if (tab === 'analytics') {
    router.push({ name: 'dashboard-analytics' })
  }
}

const activeTab = computed(() => {
  const name = route.name
  if (name === 'dashboard-home') return 'home'
  if (name === 'dashboard-works') return 'works'
  if (name === 'dashboard-series') return 'series'
  if (name === 'dashboard-reactions') return 'reactions'
  if (name === 'dashboard-analytics') return 'analytics'
  return 'works'
})

async function goLogin() {
  await router.push('/login')
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="user" class="dashboard-page">
      <div class="dashboard-wrap">
        <div class="dashboard-hero">
          <div class="dashboard-hero-inner">
            <p class="dashboard-hero-kicker">{{ $t('dashboard.title') }}</p>
            <h1 class="dashboard-hero-title">{{ $t('dashboard.welcomeBack', { name: user.displayName || user.username }) }}</h1>
            <p class="dashboard-hero-desc">{{ $t('dashboard.heroDescription') }}</p>
          </div>
        </div>

        <CreatorDashboardTabs :model-value="activeTab" @update:model-value="handleTabChange" />

        <router-view />
      </div>
    </section>

    <section v-else class="dashboard-page">
      <div class="dashboard-wrap">
        <div class="dashboard-hero">
          <div class="dashboard-hero-inner">
            <p class="dashboard-hero-kicker">{{ $t('dashboard.title') }}</p>
            <h1 class="dashboard-hero-title">{{ $t('dashboard.title') }}</h1>
            <p class="dashboard-hero-desc">{{ $t('auth.loggedOut') }}</p>
            <button type="button" class="hero-cta" @click="goLogin">{{ $t('auth.goToLogin') }}</button>
          </div>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.dashboard-page {
  display: block;
  padding: 0.4rem 0;
}

.dashboard-wrap {
  display: grid;
  gap: 0.85rem;
}

.dashboard-hero {
  border-radius: 16px;
  background: #0096fa;
  padding: 2.2rem 2rem;
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-hero-inner {
  max-width: 600px;
}

.dashboard-hero-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
  margin: 0 0 0.4rem;
}

.dashboard-hero-title {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 0.5rem;
  color: inherit;
}

.dashboard-hero-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 0.9rem;
}

.hero-cta {
  border: none;
  border-radius: 999px;
  background: var(--surface);
  color: var(--accent);
  font-weight: 800;
  padding: 0.65rem 1.2rem;
  font-size: 0.88rem;
  cursor: pointer;
}

@media (max-width: 640px) {
  .dashboard-hero {
    flex-direction: column;
    padding: 1.4rem 1.2rem;
  }

  .dashboard-hero-title {
    font-size: 1.35rem;
  }
}
</style>
