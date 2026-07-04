import { ref } from 'vue'
import { adminApi, reportApi } from '../services/api'

export function useAdminReports({ error, mutating } = {}) {
  // Shared
  const activeReportTab = ref('artwork')

  // --- Artwork reports ---
  const reportStatusFilter = ref('pending')
  const artworkReports = ref([])
  const loadingArtworkReports = ref(false)
  const artworkReportPagination = ref({ page: 1, pages: 1, total: 0 })

  async function loadArtworkReports(nextPage = 1) {
    loadingArtworkReports.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 20, page: nextPage }
      if (reportStatusFilter.value) params.status = reportStatusFilter.value
      const { data } = await adminApi.getReportedArtworks(params)
      artworkReports.value = data?.reports || []
      artworkReportPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load artwork reports'
      artworkReports.value = []
      artworkReportPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingArtworkReports.value = false
    }
  }

  function resolveArtworkReport(reportId) {
    if (mutating?.value) return
    // Returns the modal config so the parent can show it
    return {
      show: true,
      title: 'Resolve Artwork Report',
      message: 'Resolution note (optional):',
      placeholder: 'Enter a note...',
      confirmLabel: 'Resolve',
      onConfirm: async (note) => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await adminApi.resolveArtworkReport(reportId, { action: 'dismiss', note: note || '' })
          artworkReports.value = artworkReports.value.filter((r) => r._id !== reportId)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to resolve report'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function hideArtworkFromReport(artworkId, reportId) {
    if (mutating?.value) return
    return {
      show: true,
      title: 'Hide Artwork',
      message: 'Hide this artwork? The owner will be notified.',
      confirmLabel: 'Hide',
      confirmClass: 'modal-btn--danger',
      onConfirm: async () => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await adminApi.hideArtwork(artworkId, { reason: 'Violated platform guidelines after being reported' })
          artworkReports.value = artworkReports.value.filter((r) => r._id !== reportId)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to hide artwork'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function goToArtworkReportPage(nextPage) {
    if (nextPage < 1 || nextPage > artworkReportPagination.value.pages || loadingArtworkReports.value) return
    await loadArtworkReports(nextPage)
  }

  // --- Hidden artworks ---
  const hiddenArtworks = ref([])
  const loadingHiddenArtworks = ref(false)
  const hiddenArtworkPagination = ref({ page: 1, pages: 1, total: 0 })

  async function loadHiddenArtworks(nextPage = 1) {
    loadingHiddenArtworks.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 20, page: nextPage }
      const { data } = await adminApi.getHiddenArtworks(params)
      hiddenArtworks.value = data?.artworks || []
      hiddenArtworkPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load hidden artworks'
      hiddenArtworks.value = []
      hiddenArtworkPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingHiddenArtworks.value = false
    }
  }

  async function unhideArtwork(artworkId) {
    if (mutating?.value) return
    return {
      show: true,
      title: 'Unhide Artwork',
      message: 'Unhide this artwork? It will become visible to all users.',
      confirmLabel: 'Unhide',
      confirmClass: 'modal-btn--accent',
      onConfirm: async () => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await adminApi.unhideArtwork(artworkId)
          hiddenArtworks.value = hiddenArtworks.value.filter((a) => a._id !== artworkId)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to unhide artwork'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function goToHiddenArtworkPage(nextPage) {
    if (nextPage < 1 || nextPage > hiddenArtworkPagination.value.pages || loadingHiddenArtworks.value) return
    await loadHiddenArtworks(nextPage)
  }

  // --- Comment reports ---
  const commentReports = ref([])
  const loadingCommentReports = ref(false)
  const commentReportPagination = ref({ page: 1, pages: 1, total: 0 })
  const commentReportStatusFilter = ref('pending')

  async function loadCommentReports(nextPage = 1) {
    loadingCommentReports.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 20, page: nextPage }
      if (commentReportStatusFilter.value) params.status = commentReportStatusFilter.value
      const { data } = await reportApi.getReportedComments(params)
      commentReports.value = data?.reports || []
      commentReportPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load comment reports'
      commentReports.value = []
      commentReportPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingCommentReports.value = false
    }
  }

  function resolveCommentReport(reportId, action = 'dismiss') {
    if (mutating?.value) return
    return {
      show: true,
      title: 'Resolve Comment Report',
      message: 'Resolution note (optional):',
      placeholder: 'Enter a note...',
      confirmLabel: 'Resolve',
      onConfirm: async (note) => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await reportApi.resolveCommentReport(reportId, { action, note: note || '' })
          commentReports.value = commentReports.value.filter((r) => r._id !== reportId)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to resolve comment report'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function goToCommentReportPage(nextPage) {
    if (nextPage < 1 || nextPage > commentReportPagination.value.pages || loadingCommentReports.value) return
    await loadCommentReports(nextPage)
  }

  // --- User reports ---
  const userReports = ref([])
  const loadingUserReports = ref(false)
  const userReportPagination = ref({ page: 1, pages: 1, total: 0 })
  const userReportStatusFilter = ref('pending')

  async function loadUserReports(nextPage = 1) {
    loadingUserReports.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 20, page: nextPage }
      if (userReportStatusFilter.value) params.status = userReportStatusFilter.value
      const { data } = await reportApi.getAdminUserReports(params)
      userReports.value = data?.reports || []
      userReportPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load user reports'
      userReports.value = []
      userReportPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingUserReports.value = false
    }
  }

  function resolveUserReport(reportId, action = 'dismiss') {
    if (mutating?.value) return
    return {
      show: true,
      title: 'Resolve User Report',
      message: 'Resolution note (optional):',
      placeholder: 'Enter a note...',
      confirmLabel: 'Resolve',
      onConfirm: async (note) => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await reportApi.resolveUserReport(reportId, { action, note: note || '' })
          userReports.value = userReports.value.filter((r) => r._id !== reportId)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to resolve user report'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function goToUserReportPage(nextPage) {
    if (nextPage < 1 || nextPage > userReportPagination.value.pages || loadingUserReports.value) return
    await loadUserReports(nextPage)
  }

  // --- Request reports ---
  const reports = ref([])
  const loadingReports = ref(false)
  const reportPagination = ref({ page: 1, pages: 1, total: 0 })

  async function loadReports(nextPage = 1) {
    loadingReports.value = true
    if (error) error.value = ''
    try {
      const params = { limit: 20, page: nextPage }
      const { data } = await adminApi.getReportedRequests(params)
      reports.value = data?.reports || []
      reportPagination.value = {
        page: data?.page || nextPage,
        pages: data?.pages || 1,
        total: data?.total || 0,
      }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load reports'
      reports.value = []
      reportPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingReports.value = false
    }
  }

  function resolveReport(requestId) {
    if (mutating?.value) return
    return {
      show: true,
      title: 'Dismiss Reports',
      message: 'Dismiss all reports for this request?',
      confirmLabel: 'Dismiss',
      confirmClass: 'modal-btn--accent',
      onConfirm: async () => {
        if (mutating) mutating.value = true
        if (error) error.value = ''
        try {
          await adminApi.resolveReport(requestId, { action: 'dismiss' })
          reports.value = reports.value.filter((r) => r.request?._id !== requestId)
        } catch (fetchError) {
          if (error) error.value = fetchError?.response?.data?.message || 'Failed to resolve report'
        } finally {
          if (mutating) mutating.value = false
        }
      },
    }
  }

  async function goToReportPage(nextPage) {
    if (nextPage < 1 || nextPage > reportPagination.value.pages || loadingReports.value) return
    await loadReports(nextPage)
  }

  return {
    activeReportTab,
    // Artwork reports
    reportStatusFilter, artworkReports, loadingArtworkReports, artworkReportPagination,
    loadArtworkReports, resolveArtworkReport, hideArtworkFromReport, goToArtworkReportPage,
    // Hidden artworks
    hiddenArtworks, loadingHiddenArtworks, hiddenArtworkPagination,
    loadHiddenArtworks, unhideArtwork, goToHiddenArtworkPage,
    // Comment reports
    commentReports, loadingCommentReports, commentReportPagination, commentReportStatusFilter,
    loadCommentReports, resolveCommentReport, goToCommentReportPage,
    // User reports
    userReports, loadingUserReports, userReportPagination, userReportStatusFilter,
    loadUserReports, resolveUserReport, goToUserReportPage,
    // Request reports
    reports, loadingReports, reportPagination,
    loadReports, resolveReport, goToReportPage,
  }
}
