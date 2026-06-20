<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import AppSearchBar from '../components/layout/AppSearchBar.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const formError = ref('')
const showEmailForm = ref(false)

async function submitSignUp() {
  formError.value = ''

  if (!form.username.trim() || !form.email.trim() || !form.password) {
    formError.value = 'Please fill all required fields.'
    return
  }

  if (form.password !== form.confirmPassword) {
    formError.value = 'Password confirmation does not match.'
    return
  }

  try {
    await authStore.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })
    await router.push('/')
  } catch (_error) {
    formError.value = authStore.error || 'Sign up failed.'
  }
}

function googleLogin() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  window.location.href = `${baseUrl.replace(/\/+$/, '')}/auth/google`
}

function facebookLogin() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  window.location.href = `${baseUrl.replace(/\/+$/, '')}/auth/facebook`
}
</script>

<template>
  <section class="auth-shell">
    <AppSearchBar class="auth-showcase-bg" variant="showcase" :background-only="true" />
    <div class="auth-overlay"></div>

    <article class="auth-card">
      <div class="brand-wrap">
        <router-link to="/" class="brand">IlluWrl</router-link>
        <h1>Create an account</h1>
      </div>

      <div class="social-stack">
        <button type="button" class="social-btn" @click="googleLogin">
          <i class="fa-brands fa-google" aria-hidden="true"></i>
          Continue with Google
        </button>
        <button type="button" class="social-btn" @click="facebookLogin">
          <i class="fa-brands fa-facebook" aria-hidden="true"></i>
          Continue with Facebook
        </button>
      </div>

      <button type="button" class="email-toggle" @click="showEmailForm = !showEmailForm">
        {{ showEmailForm ? 'Hide e-mail form' : 'Sign up with an e-mail address' }}
      </button>

      <form v-if="showEmailForm" class="email-form" @submit.prevent="submitSignUp">
        <label class="d-grid gap-1">
          <span class="auth-label">Username</span>
          <input v-model="form.username" class="form-control auth-control" placeholder="Choose a username" aria-label="Username" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Email</span>
          <input v-model="form.email" type="email" class="form-control auth-control" placeholder="name@example.com" aria-label="Email" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Password</span>
          <input v-model="form.password" type="password" class="form-control auth-control" placeholder="At least 8 characters" aria-label="Password" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Confirm password</span>
          <input v-model="form.confirmPassword" type="password" class="form-control auth-control" placeholder="Re-enter your password" aria-label="Confirm password" />
        </label>

        <p v-if="formError" class="text-danger mb-0">{{ formError }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="switch-auth mb-0">
        Already have an account?
        <router-link to="/login">Log in</router-link>
      </p>

      <p class="policy mb-0">
        By creating an account, you agree to the Terms of Use and Privacy Policy.
      </p>
    </article>
  </section>
</template>

<style scoped src="../assets/styles/auth.css"></style>
