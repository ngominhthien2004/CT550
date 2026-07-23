import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/auth.store'

const socket = ref(null)
const isConnected = ref(false)
let refCount = 0
let currentToken = null

function getBackendUrl() {
  const uploadsUrl = import.meta.env.VITE_UPLOADS_BASE_URL || ''
  if (uploadsUrl.startsWith('http://') || uploadsUrl.startsWith('https://')) {
    try { return new URL(uploadsUrl).origin } catch { /* ignore */ }
  }
  // In dev, fall back to current origin (Vite proxy handles /socket.io)
  return window.location.origin
}

function teardownSocket() {
  if (!socket.value) return
  socket.value.removeAllListeners()
  socket.value.disconnect()
  socket.value = null
  isConnected.value = false
  currentToken = null
}

export function useSocket() {
  const authStore = useAuthStore()

  function connect() {
    const token = localStorage.getItem('token')
    if (!token || !authStore.isAuthenticated) return null

    refCount++

    // Reuse the existing socket when the same token is already connected
    if (socket.value && currentToken === token && socket.value.connected) {
      return socket.value
    }

    // Token changed or socket is stale — tear down before reconnecting
    if (socket.value) {
      teardownSocket()
    }

    currentToken = token
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

    return socket.value
  }

  function disconnect() {
    if (refCount <= 0) return
    refCount--
    if (refCount > 0) return // other consumers still need the socket
    teardownSocket()
  }

  // Explicit teardown — used on logout so the socket dies even if a
  // component forgot to release its reference.
  function disconnectAll() {
    refCount = 0
    teardownSocket()
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
    disconnectAll,
    on,
    off,
  }
}

// Standalone teardown helper for use outside a component setup context
// (e.g. inside a Pinia action on logout). Forces the socket to close
// regardless of outstanding references.
export function disconnectSocketNow() {
  refCount = 0
  teardownSocket()
}
