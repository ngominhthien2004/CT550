import { defineStore } from 'pinia'
import { watchlistApi } from '../services/api.js'

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    items: [],
    loading: false,
    loadingMore: false,
    error: '',
    page: 1,
    hasMore: true,
    total: 0,
  }),
  actions: {
    async fetchWatchlist(params = {}) {
      this.loading = true
      this.error = ''
      this.page = 1
      this.hasMore = true
      try {
        const { data } = await watchlistApi.getMy({ page: 1, ...params })
        this.items = data?.items || []
        this.total = data?.pagination?.total || 0
        this.hasMore = this.items.length < this.total
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch watchlist'
        this.items = []
      } finally {
        this.loading = false
      }
    },
    async loadMoreWatchlist(params = {}) {
      if (this.loadingMore || !this.hasMore) return
      this.loadingMore = true
      this.error = ''
      try {
        const nextPage = this.page + 1
        const { data } = await watchlistApi.getMy({ page: nextPage, ...params })
        const newItems = data?.items || []
        this.items = [...this.items, ...newItems]
        this.page = nextPage
        this.total = data?.pagination?.total || this.total
        this.hasMore = this.items.length < this.total
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load more watchlist'
      } finally {
        this.loadingMore = false
      }
    },
    async addToWatchlist(seriesId) {
      this.error = ''
      try {
        await watchlistApi.add(seriesId)
        return true
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to add to watchlist'
        throw error
      }
    },
    async removeFromWatchlist(seriesId) {
      this.error = ''
      try {
        await watchlistApi.remove(seriesId)
        // Remove from local items if present
        this.items = this.items.filter(item => item.series?._id !== seriesId)
        this.total = Math.max(0, this.total - 1)
        return true
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to remove from watchlist'
        throw error
      }
    },
    async toggleNotifications(watchlistId, currentEnabled) {
      try {
        const { data } = await watchlistApi.toggleNotifications(watchlistId)
        // Update local state
        const item = this.items.find(i => i._id === watchlistId)
        if (item) {
          item.notificationsEnabled = data.notificationsEnabled
        }
        return data.notificationsEnabled
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to toggle notifications'
        throw error
      }
    },
  },
})
