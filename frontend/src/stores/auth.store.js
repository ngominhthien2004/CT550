import { defineStore } from 'pinia'
import { loginAuthUser, registerAuthUser } from '../services/api'

const TOKEN_KEY = 'token'
const USER_KEY = 'authUser'

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch (_error) {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser(),
    token: localStorage.getItem(TOKEN_KEY) || '',
    loading: false,
    error: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    setSession(payload) {
      this.user = {
        _id: payload._id,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      }
      this.token = payload.token || ''
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
    },
    clearSession() {
      this.user = null
      this.token = ''
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
    async register(payload) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await registerAuthUser(payload)
        this.setSession(data)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Register failed'
        throw error
      } finally {
        this.loading = false
      }
    },
    async login(payload) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await loginAuthUser(payload)
        this.setSession(data)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.clearSession()
    },
  },
})
