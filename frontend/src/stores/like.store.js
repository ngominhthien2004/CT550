import { defineStore } from 'pinia'
import { createLike, deleteLike, getMyLikes, likeApi } from '../services/api'

export const useLikeStore = defineStore('likes', {
  state: () => ({
    items: [],
    statusByArtwork: {},
    togglingByArtwork: {},
    loading: false,
    error: '',
  }),
  getters: {
    getLikeStatus: (state) => (artworkId) => Boolean(state.statusByArtwork[artworkId]),
    isTogglingLike: (state) => (artworkId) => Boolean(state.togglingByArtwork[artworkId]),
  },
  actions: {
    async fetchMyLikes(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getMyLikes(params)
        this.items = data.likes || []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch likes'
      } finally {
        this.loading = false
      }
    },
    async fetchLikeStatus(artworkId) {
      if (!artworkId) {
        return { isLiked: false, likeId: null }
      }

      this.error = ''
      try {
        const { data } = await likeApi.getStatus(artworkId)
        this.statusByArtwork[artworkId] = Boolean(data?.isLiked)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch like status'
        throw error
      }
    },
    async toggleLikeByArtwork(artworkId) {
      if (!artworkId) {
        throw new Error('artworkId is required')
      }

      this.error = ''
      this.togglingByArtwork[artworkId] = true

      try {
        const { data } = await likeApi.toggle(artworkId)
        const nextStatus = Boolean(data?.isLiked)
        this.statusByArtwork[artworkId] = nextStatus

        if (!nextStatus) {
          this.items = this.items.filter((item) => {
            const likedArtworkId = item?.artwork?._id || item?.artwork
            return likedArtworkId !== artworkId
          })
        }

        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to toggle like'
        throw error
      } finally {
        this.togglingByArtwork[artworkId] = false
      }
    },
    async addLike(artworkId) {
      this.error = ''
      try {
        const { data } = await createLike({ artworkId })
        this.statusByArtwork[artworkId] = true
        this.items = [data, ...this.items]
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to create like'
        throw error
      }
    },
    async removeLike(likeId) {
      this.error = ''
      try {
        await deleteLike(likeId)
        const target = this.items.find((item) => item._id === likeId)
        const artworkId = target?.artwork?._id || target?.artwork
        if (artworkId) {
          this.statusByArtwork[artworkId] = false
        }
        this.items = this.items.filter((item) => item._id !== likeId)
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to delete like'
        throw error
      }
    },
  },
})