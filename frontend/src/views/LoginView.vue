<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import AppSearchBar from '../components/layout/AppSearchBar.vue'

const router = useRouter()
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
    await router.push('/account')
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

<style scoped>
.auth-shell {
  min-height: 100vh;
  padding: 1rem;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.auth-showcase-bg {
  position: absolute;
  inset: 0;
}

.auth-card {
  width: min(520px, 100%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.26);
  padding: 1.65rem;
  display: grid;
  gap: 0.95rem;
  position: relative;
  z-index: 1;
  font-family: 'Segoe UI', 'Noto Sans', sans-serif;
}

.auth-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.2), transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(56, 189, 248, 0.12), transparent 35%);
}

.brand-wrap {
  text-align: center;
  display: grid;
  gap: 0.2rem;
}

.brand {
  font-size: clamp(2.7rem, 6.5vw, 3.4rem);
  text-decoration: none;
  letter-spacing: -0.03em;
  color: #1695f0;
  font-weight: 800;
}

.brand-wrap h1 {
  margin: 0;
  font-size: clamp(1.15rem, 3.2vw, 1.45rem);
  font-weight: 600;
  color: #334155;
  line-height: 1.2;
}

.social-icons {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.1rem 0;
}

.social-icon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid #dbe3ef;
  background: #fff;
  color: #334155;
  font-size: 1.08rem;
}

.switch-auth {
  color: #64748b;
  font-size: 0.98rem;
}

.auth-label {
  font-size: 0.89rem;
  color: #64748b;
}

.auth-control {
  min-height: 46px;
  font-size: 1rem;
}

.auth-submit {
  min-height: 46px;
  font-size: 1.02rem;
  font-weight: 700;
}

.create-account-link {
  text-decoration: none;
  text-align: right;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 1.12rem;
}
</style>
