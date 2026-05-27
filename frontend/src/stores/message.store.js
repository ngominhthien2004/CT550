import { defineStore } from 'pinia'
import { useAuthStore } from './auth.store'
import { createMessage, getMyMessages, markMessageRead } from '../services/api'

function threadKey(message, currentUserId) {
  if (!message) return null
  if (message.threadId) return `thread:${message.threadId}`
  const outbound = String(message.sender?._id || '') === String(currentUserId || '')
  const peer = outbound ? message.recipient : message.sender
  return `peer:${peer?._id || ''}`
}

function peerLabel(message, currentUserId) {
  if (!message) return 'Unknown user'
  const outbound = String(message.sender?._id || '') === String(currentUserId || '')
  const peer = outbound ? message.recipient : message.sender
  return peer?.displayName || peer?.username || 'Unknown user'
}

function isOutbound(message, currentUserId) {
  return String(message.sender?._id || '') === String(currentUserId || '')
}

export const useMessageStore = defineStore('messages', {
  state: () => ({
    items: [],
    unreadCount: 0,
    activeBox: 'inbox',
    loading: false,
    error: '',
    inboxItems: [],
    sentItems: [],
    inboxUnreadCount: 0,
    lastFetchedAtInbox: null,
    lastFetchedAtSent: null,
    lastPreviewComposedAt: null,
  }),
  getters: {
    previewItems() {
      const authStore = useAuthStore()
      const currentUserId = authStore.user?._id

      const deduped = new Map()
      const allItems = [...this.inboxItems, ...this.sentItems]
      for (const msg of allItems) {
        if (!deduped.has(msg._id)) {
          deduped.set(msg._id, msg)
        }
      }

      const threads = new Map()
      for (const msg of deduped.values()) {
        const key = threadKey(msg, currentUserId)
        if (!key) continue
        if (!threads.has(key)) {
          threads.set(key, [])
        }
        threads.get(key).push(msg)
      }

      const previews = []
      for (const msgs of threads.values()) {
        msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const latest = msgs[0]
        const outbound = isOutbound(latest, currentUserId)
        const peer = outbound ? latest.recipient : latest.sender

        previews.push({
          ...latest,
          sender: peer,
          isRead: outbound ? true : latest.isRead,
        })
      }

      previews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return previews
    },
    previewMeta() {
      return {
        previewCount: this.previewItems.length,
        inboxCount: this.inboxItems.length,
        sentCount: this.sentItems.length,
        lastFetchedAtInbox: this.lastFetchedAtInbox,
        lastFetchedAtSent: this.lastFetchedAtSent,
        lastPreviewComposedAt: this.lastPreviewComposedAt,
      }
    },
  },
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

        if (nextBox === 'inbox') {
          this.inboxItems = data?.messages || []
          this.inboxUnreadCount = Number(data?.unreadCount || 0)
          this.lastFetchedAtInbox = Date.now()
        } else {
          this.sentItems = data?.messages || []
          this.lastFetchedAtSent = Date.now()
        }
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
        this.sentItems = [data, ...this.sentItems.filter((item) => item._id !== data._id)]
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
          if (item._id !== messageId) return item
          return { ...item, isRead: true, readAt: new Date().toISOString() }
        })
        this.unreadCount = this.items.filter((item) => !item.isRead).length

        this.inboxItems = this.inboxItems.map((item) => {
          if (item._id !== messageId) return item
          return { ...item, isRead: true, readAt: new Date().toISOString() }
        })
        this.inboxUnreadCount = this.inboxItems.filter((item) => !item.isRead).length
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to mark message as read'
        throw error
      }
    },
    async fetchPreview() {
      this.loading = true
      this.error = ''
      try {
        const [inboxRes, sentRes] = await Promise.all([
          getMyMessages({ box: 'inbox', limit: 5 }),
          getMyMessages({ box: 'sent', limit: 5 }),
        ])
        this.inboxItems = inboxRes.data?.messages || []
        this.inboxUnreadCount = Number(inboxRes.data?.unreadCount || 0)
        this.lastFetchedAtInbox = Date.now()

        this.sentItems = sentRes.data?.messages || []
        this.lastFetchedAtSent = Date.now()

        this.lastPreviewComposedAt = Date.now()
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch preview'
      } finally {
        this.loading = false
      }
    },
  },
})
