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

const localState = reactive({
  error: '',
})
const showEmailForm = ref(false)

async function submitSignUp() {
  localState.error = ''

  if (!form.username.trim() || !form.email.trim() || !form.password) {
    localState.error = 'Please fill all required fields.'
    return
  }

  if (form.password !== form.confirmPassword) {
    localState.error = 'Password confirmation does not match.'
    return
  }

  try {
    await authStore.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })
    await router.push('/account')
  } catch (_error) {
    localState.error = authStore.error || 'Sign up failed.'
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
        <h1>Create an account</h1>
      </div>

      <div class="social-stack">
        <button type="button" class="social-btn apple">
          <i class="fa-brands fa-apple" aria-hidden="true"></i>
          Continue with Apple
        </button>
        <button type="button" class="social-btn">
          <i class="fa-brands fa-google" aria-hidden="true"></i>
          Continue with Google
        </button>
        <button type="button" class="social-btn">
          <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
          Continue with X
        </button>
        <button type="button" class="social-btn">
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
          <input v-model="form.username" class="form-control auth-control" placeholder="Choose a username" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Email</span>
          <input v-model="form.email" type="email" class="form-control auth-control" placeholder="name@example.com" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Password</span>
          <input v-model="form.password" type="password" class="form-control auth-control" placeholder="At least 8 characters" />
        </label>

        <label class="d-grid gap-1">
          <span class="auth-label">Confirm password</span>
          <input v-model="form.confirmPassword" type="password" class="form-control auth-control" placeholder="Re-enter your password" />
        </label>

        <p v-if="localState.error" class="text-danger mb-0">{{ localState.error }}</p>

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
  gap: 0.9rem;
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
  font-size: clamp(3.2rem, 8.2vw, 4.4rem);
  text-decoration: none;
  letter-spacing: -0.03em;
  color: #1695f0;
  font-weight: 800;
}

.brand-wrap h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  color: #0f172a;
  line-height: 1.1;
}

.social-stack {
  display: grid;
  gap: 0.45rem;
}

.social-btn {
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  background: #fff;
  color: #1f2937;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.58rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.social-btn.apple {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
}

.email-toggle {
  border: none;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  font-weight: 700;
  font-size: 1.02rem;
  padding: 0.62rem 0.8rem;
}

.email-form {
  display: grid;
  gap: 0.55rem;
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

.switch-auth {
  color: #64748b;
  font-size: 0.98rem;
}

.policy {
  font-size: 0.83rem;
  color: #7a8699;
  text-align: center;
}
</style>
