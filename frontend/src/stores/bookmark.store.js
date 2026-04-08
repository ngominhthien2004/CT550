import { defineStore } from 'pinia'
import { bookmarkApi, createBookmark, deleteBookmark, getMyBookmarks } from '../services/api'

export const useBookmarkStore = defineStore('bookmarks', {
  state: () => ({
    items: [],
    statusByArtwork: {},
    togglingByArtwork: {},
    loading: false,
    error: '',
  }),
  getters: {
    getBookmarkStatus: (state) => (artworkId) => Boolean(state.statusByArtwork[artworkId]),
    isTogglingBookmark: (state) => (artworkId) => Boolean(state.togglingByArtwork[artworkId]),
  },
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
    async fetchBookmarkStatus(artworkId) {
      if (!artworkId) {
        return { isBookmarked: false, bookmarkId: null }
      }

      this.error = ''
      try {
        const { data } = await bookmarkApi.getStatus(artworkId)
        this.statusByArtwork[artworkId] = Boolean(data?.isBookmarked)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch bookmark status'
        throw error
      }
    },
    async toggleBookmarkByArtwork(artworkId) {
      if (!artworkId) {
        throw new Error('artworkId is required')
      }

      this.error = ''
      this.togglingByArtwork[artworkId] = true

      try {
        const { data } = await bookmarkApi.toggle(artworkId)
        const nextStatus = Boolean(data?.isBookmarked)
        this.statusByArtwork[artworkId] = nextStatus

        if (!nextStatus) {
          this.items = this.items.filter((item) => {
            const bookmarkedArtworkId = item?.artwork?._id || item?.artwork
            return bookmarkedArtworkId !== artworkId
          })
        }

        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to toggle bookmark'
        throw error
      } finally {
        this.togglingByArtwork[artworkId] = false
      }
    },
    async addBookmark(artworkId, folder = 'default') {
      this.error = ''
      try {
        const { data } = await createBookmark({ artworkId, folder })
        this.statusByArtwork[artworkId] = true
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
        const target = this.items.find((item) => item._id === bookmarkId)
        const artworkId = target?.artwork?._id || target?.artwork
        if (artworkId) {
          this.statusByArtwork[artworkId] = false
        }
        this.items = this.items.filter((item) => item._id !== bookmarkId)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to delete bookmark'
        throw error
      }
    },
  },
})
