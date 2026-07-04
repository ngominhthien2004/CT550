<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'
import AppSearchBar from '../components/layout/AppSearchBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

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
    formError.value = t('auth.pleaseFillFields')
    return
  }

  if (form.password !== form.confirmPassword) {
    formError.value = t('auth.passwordMismatch')
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
    formError.value = authStore.error || t('auth.registerFailed')
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
        <h1>{{ $t('auth.registerTitle') }}</h1>
      </div>

      <div class="social-stack">
        <button type="button" class="social-btn" @click="googleLogin">
          <i class="fa-brands fa-google" aria-hidden="true"></i>
          {{ $t('auth.continueGoogle') }}
        </button>
        <button type="button" class="social-btn" @click="facebookLogin">
          <i class="fa-brands fa-facebook" aria-hidden="true"></i>
          {{ $t('auth.continueFacebook') }}
        </button>
      </div>

      <button type="button" class="email-toggle" @click="showEmailForm = !showEmailForm">
        {{ showEmailForm ? $t('auth.hideEmailForm') : $t('auth.signUpEmail') }}
      </button>

      <form v-if="showEmailForm" class="email-form" @submit.prevent="submitSignUp">
        <label class="d-grid gap-1">
          <span class="auth-label">{{ $t('auth.username') }}</span>
          <input v-model="form.username" class="form-control auth-control" :placeholder="$t('auth.chooseUsername')" :aria-label="$t('auth.username')" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">{{ $t('auth.email') }}</span>
          <input v-model="form.email" type="email" class="form-control auth-control" :placeholder="$t('auth.emailPlaceholder')" :aria-label="$t('auth.email')" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">{{ $t('auth.password') }}</span>
          <input v-model="form.password" type="password" class="form-control auth-control" :placeholder="$t('auth.passwordMinChars')" :aria-label="$t('auth.password')" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">{{ $t('auth.confirmPassword') }}</span>
          <input v-model="form.confirmPassword" type="password" class="form-control auth-control" :placeholder="$t('auth.confirmPasswordPlaceholder')" :aria-label="$t('auth.confirmPassword')" />
        </label>

        <p v-if="formError" class="text-danger mb-0">{{ formError }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="authStore.loading">
          {{ authStore.loading ? $t('auth.registering') : $t('auth.registerButton') }}
        </button>
      </form>

      <p class="switch-auth mb-0">
        {{ $t('auth.alreadyHaveAccount') }}
        <router-link to="/login">{{ $t('auth.logInLink') }}</router-link>
      </p>

      <p class="policy mb-0">
        {{ $t('auth.agreeTerms') }}
      </p>
    </article>
  </section>
</template>

<style scoped src="../assets/styles/auth.css"></style>
