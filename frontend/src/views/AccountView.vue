<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'

const isNavCollapsed = ref(true)
const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function goLogin() {
  await router.push('/login')
}

async function logout() {
  authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="page-block p-3 p-md-4 d-grid gap-3">
      <h1 class="h4 mb-0">Account</h1>

      <div v-if="user" class="d-grid gap-1">
        <p class="mb-0"><strong>Username:</strong> {{ user.username }}</p>
        <p class="mb-0"><strong>Email:</strong> {{ user.email }}</p>
        <p class="mb-0"><strong>Role:</strong> {{ user.role }}</p>
        <button class="btn btn-outline-secondary btn-sm mt-2 justify-self-start" @click="logout">Log out</button>
      </div>

      <div v-else class="d-grid gap-2">
        <p class="text-secondary mb-0">You are not logged in.</p>
        <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
      </div>
    </section>
  </MainLayoutTemplate>
</template>
