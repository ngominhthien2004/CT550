import { defineStore } from 'pinia'
import { getTagDetail } from '../services/api'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tag: null,
    artworks: [],
    loading: false,
    error: '',
  }),
  actions: {
    async fetchTagDetail(tagName) {
      this.loading = true
      this.error = ''
      this.tag = null
      this.artworks = []

      try {
        const { data } = await getTagDetail(tagName)
        this.tag = data?.tag || null
        this.artworks = Array.isArray(data?.artworks) ? data.artworks : []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch tag detail'
      } finally {
        this.loading = false
      }
    },
  },
})
