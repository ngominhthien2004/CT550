import { defineStore } from 'pinia'
import { createComment, deleteComment, getCommentReplies, getComments } from '../services/api'

export const useCommentStore = defineStore('comments', {
  state: () => ({
    items: [],
    repliesByCommentId: {},
    loadingRepliesByCommentId: {},
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
        this.repliesByCommentId = {}
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch comments'
      } finally {
        this.loading = false
      }
    },
    async fetchReplies(commentId, params = {}) {
      this.loadingRepliesByCommentId = {
        ...this.loadingRepliesByCommentId,
        [commentId]: true,
      }
      this.error = ''
      try {
        const { data } = await getCommentReplies({ commentId, ...params })
        this.repliesByCommentId = {
          ...this.repliesByCommentId,
          [commentId]: data.replies || [],
        }
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch replies'
        throw error
      } finally {
        this.loadingRepliesByCommentId = {
          ...this.loadingRepliesByCommentId,
          [commentId]: false,
        }
      }
    },
    async addComment(artworkId, payloadOrContent) {
      this.error = ''
      try {
        const payload =
          typeof payloadOrContent === 'string'
            ? { content: payloadOrContent }
            : { ...(payloadOrContent || {}) }

        const { data } = await createComment({ artworkId, ...payload })

        if (payload.parentCommentId) {
          const parentCommentId = payload.parentCommentId
          const currentReplies = this.repliesByCommentId[parentCommentId] || []
          this.repliesByCommentId = {
            ...this.repliesByCommentId,
            [parentCommentId]: [...currentReplies, data],
          }

          this.items = this.items.map((item) =>
            item._id === parentCommentId
              ? { ...item, replyCount: (item.replyCount || 0) + 1 }
              : item,
          )
        } else {
          this.items = [...this.items, data]
        }

        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to create comment'
        throw error
      }
    },
    async removeComment(commentId) {
      this.error = ''
      try {
        await deleteComment(commentId)

        const deletedTopLevel = this.items.some((item) => item._id === commentId)
        this.items = this.items.filter((item) => item._id !== commentId)

        if (deletedTopLevel) {
          const nextReplies = { ...this.repliesByCommentId }
          delete nextReplies[commentId]
          this.repliesByCommentId = nextReplies
          return
        }

        const nextReplies = {}
        for (const [parentId, replies] of Object.entries(this.repliesByCommentId)) {
          const originalLength = replies.length
          const filteredReplies = replies.filter((reply) => reply._id !== commentId)
          nextReplies[parentId] = filteredReplies

          if (filteredReplies.length !== originalLength) {
            this.items = this.items.map((item) =>
              item._id === parentId
                ? { ...item, replyCount: Math.max(0, (item.replyCount || 0) - 1) }
                : item,
            )
          }
        }
        this.repliesByCommentId = nextReplies
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to delete comment'
        throw error
      }
    },
  },
})
