import { defineStore } from 'pinia'
import api from '../services/api.js'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    messageCount: (state) => state.messages.length,
    hasMessages: (state) => state.messages.length > 0,
  },

  actions: {
    /**
     * Send a message to the AI agent chat.
     * @param {string} message - The user's message
     * @returns {Promise<{reply: string, toolUsed: boolean}>}
     */
    async sendMessage(message) {
      if (!message?.trim()) return

      this.isLoading = true
      this.error = null

      // Add user message
      this.messages.push({
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      })

      try {
        // Build history from existing messages (excluding the last user message which we'll send)
        const history = this.messages
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content }))

        const { data } = await api.post('/ai/agent-chat', {
          message: message.trim(),
          history,
        })

        // Add assistant reply
        if (data.reply) {
          this.messages.push({
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toISOString(),
            toolUsed: data.toolUsed || false,
          })
        }

        return data
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Không thể kết nối đến AI assistant'
        this.error = errorMsg
        
        // Add error message
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
     * Send a quick prompt (for suggested buttons).
     * @param {string} prompt - The quick prompt text
     */
    async sendQuickPrompt(prompt) {
      await this.sendMessage(prompt)
    },

    /**
     * Clear conversation.
     */
    clearConversation() {
      this.messages = []
      this.error = null
    },

    /**
     * Add a system welcome message.
     */
    addWelcomeMessage() {
      if (this.messages.length === 0) {
        this.messages.push({
          role: 'assistant',
          content: '👋 Chào bạn! Tôi là trợ lý AI của IlluWrl. Tôi có thể:\n\n' +
            '• 🔍 **Tìm kiếm artwork** theo từ khóa\n' +
            '• 💡 **Gợi ý tác phẩm** dựa trên sở thích của bạn\n' +
            '• 📝 **Tóm tắt nội dung** artwork\n' +
            '• 🎨 **Trả lời câu hỏi** về nghệ thuật và illustration\n\n' +
            'Bạn muốn hỏi gì?',
          timestamp: new Date().toISOString(),
          isWelcome: true,
        })
      }
    },
  },
})
