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
    search: '',
    filterFrom: '',
    filterTo: '',
    filterCreator: '',
  }),

  actions: {
    async fetchHistory(page = 1) {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams({ page, limit: 20 })
        if (this.search) params.set('search', this.search)
        if (this.filterFrom) params.set('from', this.filterFrom)
        if (this.filterTo) params.set('to', this.filterTo)
        if (this.filterCreator) params.set('creator', this.filterCreator)

        const res = await api.get(`/users/me/history?${params.toString()}`)
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

    setSearch(value) {
      this.search = value
      this.fetchHistory(1)
    },

    setFilters({ from, to, creator }) {
      if (from !== undefined) this.filterFrom = from
      if (to !== undefined) this.filterTo = to
      if (creator !== undefined) this.filterCreator = creator
      this.fetchHistory(1)
    },

    clearFilters() {
      this.search = ''
      this.filterFrom = ''
      this.filterTo = ''
      this.filterCreator = ''
      this.fetchHistory(1)
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
