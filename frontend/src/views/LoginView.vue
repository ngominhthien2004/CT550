<script setup>
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import AppSearchBar from '../components/layout/AppSearchBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const localState = reactive({
  error: '',
})

async function submitLogin() {
  localState.error = ''

  if (!form.email.trim() || !form.password) {
    localState.error = 'Please enter your email and password.'
    return
  }

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    })
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
    await router.push(redirectPath)
  } catch (_error) {
    localState.error = authStore.error || 'Login failed.'
  }
}
</script>

<template>
  <section class="auth-shell">
    <AppSearchBar class="auth-showcase-bg" variant="showcase" :background-only="true" />
    <div class="auth-overlay"></div>

    <article class="auth-card">
      <div class="brand-wrap">
        <router-link to="/" class="brand">IlluWrl</router-link>
        <h1>Log in with an existing account</h1>
      </div>

      <div class="social-icons">
        <button type="button" class="social-icon" aria-label="Apple"><i class="fa-brands fa-apple"></i></button>
        <button type="button" class="social-icon" aria-label="Google"><i class="fa-brands fa-google"></i></button>
        <button type="button" class="social-icon" aria-label="X"><i class="fa-brands fa-x-twitter"></i></button>
        <button type="button" class="social-icon" aria-label="Facebook"><i class="fa-brands fa-facebook"></i></button>
      </div>

      <form class="d-grid gap-2" @submit.prevent="submitLogin">
        <label class="d-grid gap-1">
          <span class="auth-label">Email</span>
          <input v-model="form.email" type="email" class="form-control auth-control" placeholder="name@example.com" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Password</span>
          <input v-model="form.password" type="password" class="form-control auth-control" placeholder="Enter your password" />
        </label>

        <p v-if="localState.error" class="text-danger mb-0">{{ localState.error }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p class="switch-auth mb-0">
        New here?
        <router-link to="/signup">Create account</router-link>
      </p>

      <router-link to="/signup" class="create-account-link">Create an account</router-link>
    </article>
  </section>
</template>

<style scoped src="../assets/styles/auth.css"></style>
