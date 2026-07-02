import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/auth.store'

const socket = ref(null)
const isConnected = ref(false)

function getBackendUrl() {
  const uploadsUrl = import.meta.env.VITE_UPLOADS_BASE_URL || ''
  if (uploadsUrl.startsWith('http://') || uploadsUrl.startsWith('https://')) {
    try { return new URL(uploadsUrl).origin } catch { /* ignore */ }
  }
  // In dev, fall back to current origin (Vite proxy handles /socket.io)
  return window.location.origin
}

export function useSocket() {
  const authStore = useAuthStore()

  function connect() {
    if (socket.value?.connected) return

    const token = localStorage.getItem('token')
    if (!token || !authStore.isAuthenticated) return

    socket.value = io(getBackendUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('[Socket] Connected')
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[Socket] Disconnected:', reason)
    })

    socket.value.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message)
    })
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  function on(event, callback) {
    socket.value?.on(event, callback)
  }

  function off(event, callback) {
    socket.value?.off(event, callback)
  }

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    on,
    off,
  }
}
