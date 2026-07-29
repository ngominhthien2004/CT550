import { defineStore } from 'pinia'
import { bookBookmarkApi } from '../services/book.api.js'

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
