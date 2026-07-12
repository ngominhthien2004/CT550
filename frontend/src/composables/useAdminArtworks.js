import { ref } from 'vue'
import { adminApi } from '../services/api'

export function useAdminArtworks({ error, mutating } = {}) {
  const artworkQuery = ref('')
  const artworkTypeFilter = ref('all')
  const artworkDateRange = ref({ from: '', to: '' })
  const artworks = ref([])
  const artworkPanelFiltersOpen = ref(true)
  const artworkPagination = ref({ page: 1, pages: 1, total: 0 })
  const loadingArtworks = ref(false)

  async function loadArtworks(nextPage = 1) {
    loadingArtworks.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 20, page: nextPage }
      if (artworkQuery.value.trim()) params.q = artworkQuery.value.trim()
      if (artworkTypeFilter.value !== 'all') params.type = artworkTypeFilter.value
      if (artworkDateRange.value.from) params.from = artworkDateRange.value.from
      if (artworkDateRange.value.to) params.to = artworkDateRange.value.to
      const { data } = await adminApi.getArtworks(params)
      artworks.value = data?.artworks || []
      artworkPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load artworks'
      artworks.value = []
      artworkPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingArtworks.value = false
    }
  }

  function deleteArtwork(targetArtwork) {
    return {
      title: 'Delete artwork',
      message: `Permanently delete "${targetArtwork.title || 'Untitled'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await adminApi.deleteArtwork(targetArtwork._id)
          artworks.value = artworks.value.filter((a) => a._id !== targetArtwork._id)
          artworkPagination.value.total = Math.max(0, artworkPagination.value.total - 1)
          await loadArtworks(artworkPagination.value.page || 1)
        } catch (deleteError) {
          if (error) error.value = deleteError?.response?.data?.message || 'Failed to delete artwork'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  function toggleArtworkFilters() { artworkPanelFiltersOpen.value = !artworkPanelFiltersOpen.value }

  async function goToArtworkPage(nextPage) {
    if (nextPage < 1 || nextPage > artworkPagination.value.pages || loadingArtworks.value) return
    await loadArtworks(nextPage)
  }

  return {
    artworkQuery, artworkTypeFilter, artworkDateRange, artworks, artworkPanelFiltersOpen, artworkPagination, loadingArtworks,
    loadArtworks, deleteArtwork, toggleArtworkFilters, goToArtworkPage,
  }
}
