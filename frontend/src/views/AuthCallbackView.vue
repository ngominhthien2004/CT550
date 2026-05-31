<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  const { token, _id, username, email, role } = route.query

  if (!token || !_id) {
    router.replace({ name: 'login', query: { error: 'google_auth_failed' } })
    return
  }

  authStore.setSession({
    _id,
    username: username || '',
    email: email || '',
    role: role || 'user',
    token,
  })

  const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.replace(redirectPath)
})
</script>

<template>
  <section class="auth-callback-shell d-flex align-items-center justify-content-center" style="min-height: 100vh;">
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Signing in with Google...</span>
      </div>
      <p class="mt-3 text-muted">Signing in with Google...</p>
    </div>
  </section>
</template>
