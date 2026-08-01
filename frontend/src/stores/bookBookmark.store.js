import { defineStore } from 'pinia'
import { bookBookmarkApi } from '../services/book.api.js'
import { useAuthStore } from './auth.store.js'

export const useBookBookmarkStore = defineStore('bookBookmark', {
  state: () => ({
    statusByBook: {},       // { [bookId]: true/false }
    togglingByBook: {},     // { [bookId]: bool }
    items: [],              // user's bookmarked books
    loading: false,
    error: '',
  }),

  getters: {
    isBookmarked: (state) => (bookId) => Boolean(state.statusByBook[bookId]),
    isToggling: (state) => (bookId) => Boolean(state.togglingByBook[bookId]),
  },

  actions: {
    async fetchStatus(bookId) {
      if (!bookId) return
      try {
        const { data } = await bookBookmarkApi.getStatus(bookId)
        this.statusByBook[bookId] = Boolean(data?.isBookmarked)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch bookmark status'
      }
    },

    // Batch status lookup for grids. Only fetches ids whose status is not yet
    // known, so repeated renders / pagination do not re-fire requests.
    async fetchStatuses(bookIds) {
      if (!Array.isArray(bookIds) || bookIds.length === 0) return
      if (!useAuthStore().isAuthenticated) return

      const known = new Set(Object.keys(this.statusByBook))
      const missingIds = [...new Set(bookIds)].filter((id) => id && !known.has(id))
      if (missingIds.length === 0) return

      try {
        const { data } = await bookBookmarkApi.getStatuses(missingIds)
        const statuses = data?.statuses || {}
        // Only bookmarked ids appear in the response; absent ids stay unknown
        // (undefined) so the getter defaults them to false.
        Object.keys(statuses).forEach((bookId) => {
          if (statuses[bookId]) this.statusByBook[bookId] = true
        })
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch bookmark statuses'
      }
    },

    async toggleBookmark(bookId) {
      if (!bookId) return
      this.togglingByBook[bookId] = true
      try {
        const { data } = await bookBookmarkApi.toggle(bookId)
        this.statusByBook[bookId] = Boolean(data?.isBookmarked)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to toggle bookmark'
        throw error
      } finally {
        this.togglingByBook[bookId] = false
      }
    },

    async fetchMyBookBookmarks(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await bookBookmarkApi.getMine(params)
        this.items = data?.bookmarks || []
        // Pre-populate status map
        this.items.forEach((item) => {
          const bookId = item?.bookId
          if (bookId) this.statusByBook[bookId] = true
        })
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch bookmarks'
      } finally {
        this.loading = false
      }
    },

    async removeBookmark(bookmarkId) {
      try {
        await bookBookmarkApi.delete(bookmarkId)
        const target = this.items.find((i) => i._id === bookmarkId)
        if (target?.bookId) {
          this.statusByBook[target.bookId] = false
        }
        this.items = this.items.filter((i) => i._id !== bookmarkId)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to remove bookmark'
        throw error
      }
    },
  },
})
