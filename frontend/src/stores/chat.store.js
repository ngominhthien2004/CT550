import { defineStore } from 'pinia'
import api from '../services/api.js'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    isSessionsLoading: false,
    error: null,
    streamingMessage: '',
    isStreaming: false,
    abortController: null,
    bubbleOpen: false,
  }),

  getters: {
    messageCount: (state) => state.messages.length,
    hasMessages: (state) => state.messages.length > 0,
    currentSession: (state) => {
      return state.sessions.find(s => s._id === state.currentSessionId) || null
    },
    sortedSessions: (state) => {
      return [...state.sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    },
    unreadCount: (state) => {
      if (!state.messages.length || state.bubbleOpen) return 0
      const last = state.messages[state.messages.length - 1]
      return last && last.role === 'assistant' ? 1 : 0
    },
  },

  actions: {
    /**
     * Load all sessions from backend.
     */
    async loadSessions() {
      this.isSessionsLoading = true
      try {
        const { data } = await api.get('/chat-sessions')
        this.sessions = data
      } catch (err) {
        console.error('Failed to load sessions:', err)
      } finally {
        this.isSessionsLoading = false
      }
    },

    /**
     * Create a new chat session.
     * Auto-switches to the new session.
     */
    async createSession() {
      try {
        const { data } = await api.post('/chat-sessions', {})
        this.sessions.unshift(data)
        this.currentSessionId = data._id
        this.messages = []
        // Load messages (will include welcome message from backend)
        await this.loadSessionMessages(data._id)
        return data
      } catch (err) {
        console.error('Failed to create session:', err)
        return null
      }
    },

    /**
     * Delete a session.
     */
    async deleteSession(sessionId) {
      try {
        await api.delete(`/chat-sessions/${sessionId}`)
        this.sessions = this.sessions.filter(s => s._id !== sessionId)
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = null
          this.messages = []
        }
      } catch (err) {
        console.error('Failed to delete session:', err)
      }
    },

    /**
     * Switch to a different session.
     */
    async switchSession(sessionId) {
      if (sessionId === this.currentSessionId) return
      this.currentSessionId = sessionId
      this.messages = []
      this.error = null
      await this.loadSessionMessages(sessionId)
    },

    /**
     * Load messages for a session.
     */
    async loadSessionMessages(sessionId) {
      try {
        const { data } = await api.get(`/chat-sessions/${sessionId}/messages`)
        this.messages = data
      } catch (err) {
        console.error('Failed to load messages:', err)
        this.error = 'Không thể tải tin nhắn'
      }
    },

    /**
     * Send a message to the AI agent chat.
     * @param {string} message - The user's message
     * @returns {Promise<{reply: string, toolUsed: boolean}>}
     */
    async sendMessage(message) {
      if (!message?.trim()) return

      this.isLoading = true
      this.error = null

      // Add user message locally
      this.messages.push({
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      })

      try {
        // Build history from existing messages
        const history = this.messages
          .filter(m => !m.isWelcome) // exclude welcome from history
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content }))

        const { data } = await api.post('/ai/agent-chat', {
          message: message.trim(),
          history,
          sessionId: this.currentSessionId,
        })

        // Add assistant reply locally
        if (data.reply) {
          this.messages.push({
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toISOString(),
            toolUsed: data.toolUsed || false,
          })
        }

        // Refresh session list to get updated title
        await this.loadSessions()

        return data
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Không thể kết nối đến AI assistant'
        this.error = errorMsg

        this.messages.push({
          role: 'assistant',
          content: `❌ ${errorMsg}`,
          timestamp: new Date().toISOString(),
          isError: true,
        })

        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Send a message with streaming response.
     * Uses fetch() directly for raw ReadableStream access.
     * @param {string} message - The user's message
     * @returns {Promise<{reply: string}|null>}
     */
    async sendMessageStream(message) {
      if (!message?.trim()) return

      this.isLoading = true
      this.isStreaming = true
      this.error = null
      this.streamingMessage = ''

      this.abortController = new AbortController()

      this.messages.push({
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      })

      try {
        const history = this.messages
          .filter(m => !m.isWelcome)
          .slice(0, -1)
          .map(m => ({ role: m.role, content: m.content }))

        const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_BASE_URL}/ai/agent-chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: message.trim(),
            history,
            sessionId: this.currentSessionId,
          }),
          signal: this.abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const data = trimmed.slice(6)

            if (data === '[DONE]') {
              if (this.streamingMessage) {
                this.messages.push({
                  role: 'assistant',
                  content: this.streamingMessage,
                  timestamp: new Date().toISOString(),
                  toolUsed: false,
                })
              }
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              const token = parsed.token || ''
              this.streamingMessage += token
            } catch (e) {
              if (e.message.toLowerCase().includes('error')) throw e
            }
          }
        }

        await this.loadSessions()

        return { reply: this.streamingMessage }
      } catch (err) {
        if (err.name === 'AbortError') {
          if (this.streamingMessage) {
            this.messages.push({
              role: 'assistant',
              content: this.streamingMessage + '\n\n*(Đã ngừng sinh)*',
              timestamp: new Date().toISOString(),
            })
          }
          return null
        }

        const errorMsg = err.response?.data?.message || err.message || 'Không thể kết nối đến AI assistant'
        this.error = errorMsg
        this.messages.push({
          role: 'assistant',
          content: `❌ ${errorMsg}`,
          timestamp: new Date().toISOString(),
          isError: true,
        })
        return null
      } finally {
        this.isLoading = false
        this.isStreaming = false
        this.streamingMessage = ''
        this.abortController = null
      }
    },

    /**
     * Stop an in-progress streaming generation.
     */
    stopGeneration() {
      if (this.abortController) {
        this.abortController.abort()
      }
    },

    /**
     * Send a quick prompt (for suggested buttons).
     * @param {string} prompt - The quick prompt text
     */
    async sendQuickPrompt(prompt) {
      await this.sendMessage(prompt)
    },

    /**
     * Clear current conversation and reset.
     */
    clearConversation() {
      this.messages = []
      this.error = null
    },

    /**
     * Initialize: load sessions, create first if none exist.
     */
    async initialize() {
      await this.loadSessions()
      if (this.sessions.length === 0) {
        await this.createSession()
      } else {
        this.currentSessionId = this.sessions[0]._id
        await this.loadSessionMessages(this.currentSessionId)
      }
    },

    toggleBubble() { this.bubbleOpen = !this.bubbleOpen },
    openBubble() { this.bubbleOpen = true },
    closeBubble() { this.bubbleOpen = false },
  },
})
