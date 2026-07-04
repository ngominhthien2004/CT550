<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'
import AppSearchBar from '../components/layout/AppSearchBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const form = reactive({
  email: '',
  password: '',
})

const formError = ref('')
const suspendedMessage = computed(() => route.query.reason === 'suspended'
  ? t('auth.suspended')
  : '')

async function submitLogin() {
  formError.value = ''

  if (!form.email.trim() || !form.password) {
    formError.value = t('auth.missingFields')
    return
  }

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    })
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirectPath)
  } catch (_error) {
    formError.value = authStore.error || t('auth.loginFailed')
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
        <h1>{{ $t('auth.loginTitle') }}</h1>
      </div>

      <div class="social-icons">
        <button type="button" class="social-icon" aria-label="Google" @click="googleLogin"><i class="fa-brands fa-google"></i></button>
        <button type="button" class="social-icon" aria-label="Facebook" @click="facebookLogin"><i class="fa-brands fa-facebook"></i></button>
      </div>

      <form class="d-grid gap-2" @submit.prevent="submitLogin">
        <label class="d-grid gap-1">
          <span class="auth-label">{{ $t('auth.email') }}</span>
          <input v-model="form.email" type="email" class="form-control auth-control" :placeholder="$t('auth.emailPlaceholder')" :aria-label="$t('auth.email')" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">{{ $t('auth.password') }}</span>
          <input v-model="form.password" type="password" class="form-control auth-control" :placeholder="$t('auth.passwordPlaceholder')" :aria-label="$t('auth.password')" />
        </label>

        <p v-if="suspendedMessage" class="text-warning mb-0" style="background: rgba(251, 191, 36, 0.1); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(251, 191, 36, 0.3);">
          <i class="fa-solid fa-triangle-exclamation me-1"></i>{{ suspendedMessage }}
        </p>

        <p v-if="formError" class="text-danger mb-0">{{ formError }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="authStore.loading">
          {{ authStore.loading ? $t('auth.loggingIn') : $t('auth.loginButton') }}
        </button>
      </form>

      <p class="switch-auth mb-0">
        {{ $t('auth.newHere') }}
        <router-link to="/signup">{{ $t('auth.createAccount') }}</router-link>
      </p>
    </article>
  </section>
</template>

<style scoped src="../assets/styles/auth.css"></style>
