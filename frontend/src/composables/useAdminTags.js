import { ref } from 'vue'
import { adminApi } from '../services/api'

export function useAdminTags({ error, mutating } = {}) {
  const tagQuery = ref('')
  const tags = ref([])
  const tagPanelFiltersOpen = ref(true)
  const tagPagination = ref({ page: 1, pages: 1, total: 0 })
  const loadingTags = ref(false)

  async function loadTags(nextPage = 1) {
    loadingTags.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 30, page: nextPage }
      if (tagQuery.value.trim()) params.q = tagQuery.value.trim()
      const { data } = await adminApi.getTags(params)
      tags.value = data?.tags || []
      tagPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load tags'
      tags.value = []
      tagPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingTags.value = false
    }
  }

  async function deleteTag(tagId) {
    if (mutating?.value) return
    return {
      show: true,
      title: 'Delete Tag',
      message: 'Delete this tag? It will be removed from all artworks.',
      confirmLabel: 'Delete',
      confirmClass: 'modal-btn--danger',
      onConfirm: async () => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await adminApi.deleteTag(tagId)
          await loadTags(tagPagination.value.page || 1)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to delete tag'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function mergeTags({ sourceId, targetId }) {
    if (mutating?.value) return
    if (mutating) mutating.value = true
    if (error) error.value = ''
    try {
      await adminApi.mergeTags({ sourceId, targetId })
      await loadTags(tagPagination.value.page || 1)
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to merge tags'
    } finally {
      if (mutating) mutating.value = false
    }
  }

  async function updateTag({ tagId, name, translations }) {
    if (mutating?.value) return
    if (mutating) mutating.value = true
    if (error) error.value = ''
    try {
      await adminApi.updateTag(tagId, { name, translations })
      await loadTags(tagPagination.value.page || 1)
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to update tag'
    } finally {
      if (mutating) mutating.value = false
    }
  }

  function toggleTagFilters() { tagPanelFiltersOpen.value = !tagPanelFiltersOpen.value }

  async function goToTagPage(nextPage) {
    if (nextPage < 1 || nextPage > tagPagination.value.pages || loadingTags.value) return
    await loadTags(nextPage)
  }

  return {
    tagQuery, tags, tagPanelFiltersOpen, tagPagination, loadingTags,
    loadTags, deleteTag, mergeTags, updateTag, toggleTagFilters, goToTagPage,
  }
}
