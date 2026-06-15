import { defineStore } from 'pinia'
import api from '@/services/api'

export const useBrowseHistoryStore = defineStore('browseHistory', {
  state: () => ({
    entries: [],
    total: 0,
    page: 1,
    pages: 0,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchHistory(page = 1) {
      this.loading = true
      this.error = null
      try {
        const res = await api.get(`/users/me/history?page=${page}&limit=20`)
        this.entries = res.data.entries
        this.total = res.data.total
        this.page = res.data.page
        this.pages = res.data.pages
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load browsing history'
      } finally {
        this.loading = false
      }
    },

    async clearHistory() {
      this.loading = true
      this.error = null
      try {
        await api.delete('/users/me/history')
        this.entries = []
        this.total = 0
        this.page = 1
        this.pages = 0
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to clear history'
      } finally {
        this.loading = false
      }
    },
  },
})
