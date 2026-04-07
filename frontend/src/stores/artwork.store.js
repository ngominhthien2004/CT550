import { defineStore } from 'pinia'
import { createArtwork, getArtworkById } from '../services/api'

export const useArtworkStore = defineStore('artwork', {
  state: () => ({
    detail: null,
    loading: false,
    error: '',
    createLoading: false,
    createError: '',
    createSuccess: false,
    createdArtwork: null,
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

    resetCreateState() {
      this.createLoading = false
      this.createError = ''
      this.createSuccess = false
      this.createdArtwork = null
    },

    async submitArtwork(payload = {}) {
      this.createLoading = true
      this.createError = ''
      this.createSuccess = false

      try {
        const imagesInput = payload.images ?? []
        const images = Array.from(imagesInput)

        if (images.length === 0) {
          throw new Error('Please upload at least one image')
        }

        const formData = new FormData()

        if (payload.title) formData.append('title', payload.title)
        if (payload.description) formData.append('description', payload.description)
        if (payload.type) formData.append('type', payload.type)
        if (payload.ageRating) formData.append('ageRating', payload.ageRating)

        const tags = Array.isArray(payload.tags)
          ? payload.tags
          : String(payload.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)

        tags.forEach((tag) => {
          formData.append('tags', tag)
        })

        images.forEach((image) => {
          formData.append('images', image)
        })

        const { data } = await createArtwork(formData)
        this.createdArtwork = data
        this.createSuccess = true
        return data
      } catch (error) {
        this.createdArtwork = null
        this.createError = error?.response?.data?.message || error?.message || 'Failed to create artwork'
        throw error
      } finally {
        this.createLoading = false
      }
    },
  },
})
