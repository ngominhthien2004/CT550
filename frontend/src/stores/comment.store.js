import { defineStore } from 'pinia'
import { createComment, deleteComment, getComments } from '../services/api'

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
    async addComment(artworkId, content) {
      this.error = ''
      try {
        const { data } = await createComment({ artworkId, content })
        this.items = [data, ...this.items]
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to create comment'
        throw error
      }
    },
    async removeComment(commentId) {
      this.error = ''
      try {
        await deleteComment(commentId)
        this.items = this.items.filter((item) => item._id !== commentId)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to delete comment'
        throw error
      }
    },
  },
})
