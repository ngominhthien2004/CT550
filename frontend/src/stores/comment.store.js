import { defineStore } from 'pinia'
import { getComments } from '../services/api'

export const useCommentStore = defineStore('comments', {
  state: () => ({
    items: [],
    loading: false,
    error: '',
  }),
  actions: {
    async fetchComments(artworkId, params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getComments({ artworkId, ...params })
        this.items = data.comments || []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch comments'
      } finally {
        this.loading = false
      }
    },
  },
})
