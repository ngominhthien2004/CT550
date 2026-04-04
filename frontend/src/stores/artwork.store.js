import { defineStore } from 'pinia'
import { getArtworkById } from '../services/api'

export const useArtworkStore = defineStore('artwork', {
  state: () => ({
    detail: null,
    loading: false,
    error: '',
  }),
  actions: {
    async fetchArtworkDetail(artworkId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getArtworkById(artworkId)
        this.detail = data
      } catch (error) {
        this.detail = null
        this.error = error?.response?.data?.message || 'Failed to fetch artwork detail'
      } finally {
        this.loading = false
      }
    },
  },
})
