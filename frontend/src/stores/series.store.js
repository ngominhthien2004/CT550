import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { seriesApi } from '@/services/api'

export const useSeriesStore = defineStore('series', () => {
  const seriesList = ref([])
  const currentSeries = ref(null)
  const loading = ref(false)
  const error = ref('')

  const mangaSeries = computed(() => seriesList.value.filter(s => s.type === 'manga'))
  const novelSeries = computed(() => seriesList.value.filter(s => s.type === 'novel'))

  async function fetchMySeries(type = null, sort = 'newest') {
    loading.value = true
    error.value = ''
    try {
      const params = {}
      if (type) params.type = type
      if (sort) params.sort = sort
      const { data } = await seriesApi.getMySeries(params)
      seriesList.value = Array.isArray(data) ? data : []
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to load series'
      seriesList.value = []
    } finally {
      loading.value = false
    }
  }

  async function createSeries(payload) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await seriesApi.create(payload)
      seriesList.value = [data, ...seriesList.value]
      return data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to create series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSeriesById(seriesId) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await seriesApi.getById(seriesId)
      currentSeries.value = data
      return data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to load series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSeries(seriesId, payload) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await seriesApi.update(seriesId, payload)
      seriesList.value = seriesList.value.map(s => s._id === seriesId ? data : s)
      if (currentSeries.value?._id === seriesId) currentSeries.value = data
      return data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to update series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSeries(seriesId) {
    loading.value = true
    error.value = ''
    try {
      await seriesApi.delete(seriesId)
      seriesList.value = seriesList.value.filter(s => s._id !== seriesId)
      if (currentSeries.value?._id === seriesId) currentSeries.value = null
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to delete series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addArtworkToSeries(seriesId, artworkId) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await seriesApi.addArtwork(seriesId, artworkId)
      seriesList.value = seriesList.value.map(s => s._id === seriesId ? data : s)
      if (currentSeries.value?._id === seriesId) currentSeries.value = data
      return data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to add artwork'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeArtworkFromSeries(seriesId, artworkId) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await seriesApi.removeArtwork(seriesId, artworkId)
      seriesList.value = seriesList.value.map(s => s._id === seriesId ? data : s)
      if (currentSeries.value?._id === seriesId) currentSeries.value = data
      return data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to remove artwork'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    seriesList,
    currentSeries,
    loading,
    error,
    mangaSeries,
    novelSeries,
    fetchMySeries,
    createSeries,
    fetchSeriesById,
    updateSeries,
    deleteSeries,
    addArtworkToSeries,
    removeArtworkFromSeries,
  }
})
