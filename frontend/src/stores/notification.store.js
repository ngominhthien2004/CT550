import { defineStore } from 'pinia'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api.js'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [],
    unreadCount: 0,
    loading: false,
    loadingMore: false,
    error: '',
    page: 1,
    hasMore: true,
  }),
  actions: {
    async fetchNotifications(params = {}) {
      this.loading = true
      this.error = ''
      this.page = 1
      this.hasMore = true
      try {
        const { data } = await getMyNotifications({ page: 1, ...params })
        this.items = data?.notifications || []
        this.unreadCount = Number(data?.unreadCount || 0)
        this.hasMore = this.items.length < (data?.total || 0)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch notifications'
        this.items = []
      } finally {
        this.loading = false
      }
    },
    async loadMoreNotifications(params = {}) {
      if (this.loadingMore || !this.hasMore) return
      this.loadingMore = true
      this.error = ''
      try {
        const nextPage = this.page + 1
        const { data } = await getMyNotifications({ page: nextPage, ...params })
        const newItems = data?.notifications || []
        this.items = [...this.items, ...newItems]
        this.page = nextPage
        this.hasMore = this.items.length < (data?.total || 0)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load more notifications'
      } finally {
        this.loadingMore = false
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
          }
        })
        this.unreadCount = this.items.filter((item) => !item.isRead).length
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to mark notification as read'
        throw error
      }
    },
    async readAllNotifications() {
      this.error = ''
      try {
        await markAllNotificationsRead()
        this.items = this.items.map((item) => ({
          ...item,
          isRead: true,
        }))
        this.unreadCount = 0
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to mark all as read'
        throw error
      }
    },
    addRealtimeNotification(notification) {
      // Avoid duplicates
      if (this.items.some((item) => item._id === notification._id)) {
        return
      }
      this.items = [notification, ...this.items]
      if (!notification.isRead) {
        this.unreadCount += 1
      }
    },
  },
})
