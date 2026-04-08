import { defineStore } from 'pinia'
import { getMyNotifications, markNotificationRead } from '../services/api'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [],
    unreadCount: 0,
    loading: false,
    error: '',
  }),
  actions: {
    async fetchNotifications(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getMyNotifications(params)
        this.items = data?.notifications || []
        this.unreadCount = Number(data?.unreadCount || 0)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch notifications'
        this.items = []
      } finally {
        this.loading = false
      }
    },
    async readNotification(notificationId) {
      this.error = ''
      try {
        await markNotificationRead(notificationId)
        this.items = this.items.map((item) => {
          if (item._id !== notificationId) {
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
        this.error = error?.response?.data?.message || 'Failed to mark notification as read'
        throw error
      }
    },
  },
})
