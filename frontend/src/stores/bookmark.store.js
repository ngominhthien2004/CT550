import { defineStore } from 'pinia'
import { getMyBookmarks } from '../services/api'

export const useBookmarkStore = defineStore('bookmarks', {
  state: () => ({
    items: [],
    loading: false,
    error: '',
  }),
  actions: {
    async fetchMyBookmarks(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getMyBookmarks(params)
        this.items = data.bookmarks || []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch bookmarks'
      } finally {
        this.loading = false
      }
    },
  },
})
