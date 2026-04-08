import { defineStore } from 'pinia'
import { createMessage, getMyMessages, markMessageRead } from '../services/api'

export const useMessageStore = defineStore('messages', {
  state: () => ({
    items: [],
    unreadCount: 0,
    activeBox: 'inbox',
    loading: false,
    error: '',
  }),
  actions: {
    async fetchMessages(params = {}) {
      this.loading = true
      this.error = ''

      const nextBox = params.box === 'sent' ? 'sent' : 'inbox'
      this.activeBox = nextBox

      try {
        const { data } = await getMyMessages({ ...params, box: nextBox })
        this.items = data?.messages || []
        this.unreadCount = Number(data?.unreadCount || 0)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch messages'
        this.items = []
      } finally {
        this.loading = false
      }
    },
    async sendMessage(payload) {
      this.error = ''
      try {
        const { data } = await createMessage(payload)
        if (this.activeBox === 'sent') {
          this.items = [data, ...this.items]
        }
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to send message'
        throw error
      }
    },
    async readMessage(messageId) {
      this.error = ''
      try {
        await markMessageRead(messageId)
        this.items = this.items.map((item) => {
          if (item._id !== messageId) {
            return item
          }
          return {
            ...item,
            isRead: true,
            readAt: new Date().toISOString(),
          }
        })
        this.unreadCount = this.items.filter((item) => !item.isRead).length
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to mark message as read'
        throw error
      }
    },
  },
})
