import { defineStore } from 'pinia'
import { createBookmark, deleteBookmark, getMyBookmarks } from '../services/api'

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
    async addBookmark(artworkId, folder = 'default') {
      this.error = ''
      try {
        const { data } = await createBookmark({ artworkId, folder })
        this.items = [data, ...this.items]
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to create bookmark'
        throw error
      }
    },
    async removeBookmark(bookmarkId) {
      this.error = ''
      try {
        await deleteBookmark(bookmarkId)
        this.items = this.items.filter((item) => item._id !== bookmarkId)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to delete bookmark'
        throw error
      }
    },
  },
})
