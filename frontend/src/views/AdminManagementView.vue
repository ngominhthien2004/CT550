<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import {
  AdminOverviewCards, AdminSectionTabs,
  AdminUserManagementPanel, AdminArtworkModerationPanel,
  AdminCommentModerationPanel,
  AdminReportReviewPanel, AdminTagManagementPanel,
  AdminAISettingsPanel,
  AdminArtworkReportPanel, AdminHiddenArtworksPanel,
} from '@/components/admin'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { adminApi } from '../services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const loadingOverview = ref(false)
const loadingUsers = ref(false)
const loadingArtworks = ref(false)
const loadingComments = ref(false)
const loadingReports = ref(false)
const loadingTags = ref(false)
const mutating = ref(false)
const error = ref('')

const overview = ref({
  totalUsers: 0,
  totalAdmins: 0,
  totalArtworks: 0,
  totalComments: 0,
})

// User management state
const userQuery = ref('')
const userRoleFilter = ref('all')
const users = ref([])
const userPanelFiltersOpen = ref(true)
const userPagination = ref({ page: 1, pages: 1, total: 0 })

// Artwork moderation state
const artworkQuery = ref('')
const artworks = ref([])
const artworkPanelFiltersOpen = ref(true)
const artworkPagination = ref({ page: 1, pages: 1, total: 0 })

// Comment moderation state
const commentQuery = ref('')
const comments = ref([])
const commentPanelFiltersOpen = ref(true)
const commentPagination = ref({ page: 1, pages: 1, total: 0 })

// Payment management state
const paymentStatusFilter = ref('all')
const payments = ref([])
const paymentPanelFiltersOpen = ref(true)
const paymentPagination = ref({ page: 1, pages: 1, total: 0 })

// Report review state
const reports = ref([])
const reportPagination = ref({ page: 1, pages: 1, total: 0 })

// Tag management state
const tagQuery = ref('')
const tags = ref([])
const tagPanelFiltersOpen = ref(true)
const tagPagination = ref({ page: 1, pages: 1, total: 0 })

// Artwork report review state
const reportStatusFilter = ref('pending')
const artworkReports = ref([])
const loadingArtworkReports = ref(false)
const artworkReportPagination = ref({ page: 1, pages: 1, total: 0 })

// Hidden artworks state
const hiddenArtworks = ref([])
const loadingHiddenArtworks = ref(false)
const hiddenArtworkPagination = ref({ page: 1, pages: 1, total: 0 })

const activeTab = ref('users')

const adminTabs = [
  { id: 'users', label: 'User management' },
  { id: 'artworks', label: 'Artwork moderation' },
  { id: 'artwork-reports', label: 'Artwork reports' },
  { id: 'comments', label: 'Comment moderation' },
  { id: 'hidden-artworks', label: 'Hidden artworks' },
  { id: 'reports', label: 'Report review' },
  { id: 'tags', label: 'Tag management' },
  { id: 'ai', label: 'AI Settings' },
]

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function goLogin() {
  await router.push('/login')
}

async function loadOverview() {
  loadingOverview.value = true
  try {
    const { data } = await adminApi.getOverview()
    overview.value = {
      ...overview.value,
      ...data,
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load admin overview'
  } finally {
    loadingOverview.value = false
  }
}

// --- User management ---
async function loadUsers(nextPage = 1) {
  loadingUsers.value = true
  error.value = ''
  try {
    const params = { limit: 20, page: nextPage }
    if (userQuery.value.trim()) params.q = userQuery.value.trim()
    if (userRoleFilter.value !== 'all') params.role = userRoleFilter.value
    const { data } = await adminApi.getUsers(params)
    users.value = data?.users || []
    userPagination.value = {
      page: data?.page || nextPage,
      pages: data?.pages || 1,
      total: data?.total || 0,
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load users'
    users.value = []
    userPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingUsers.value = false
  }
}

async function setUserRole(targetUser, nextRole) {
  if (mutating.value) return
  mutating.value = true
  error.value = ''
  try {
    const { data } = await adminApi.updateUser(targetUser._id, { role: nextRole })
    users.value = users.value.map((item) => (item._id === targetUser._id ? data : item))
    if (targetUser._id === user.value?._id) {
      authStore.user = { ...authStore.user, role: data.role }
      localStorage.setItem('authUser', JSON.stringify(authStore.user))
    }
    await loadOverview()
  } catch (updateError) {
    error.value = updateError?.response?.data?.message || 'Failed to update user role'
  } finally {
    mutating.value = false
  }
}

function toggleUserFilters() { userPanelFiltersOpen.value = !userPanelFiltersOpen.value }

async function goToUserPage(nextPage) {
  if (nextPage < 1 || nextPage > userPagination.value.pages || loadingUsers.value) return
  await loadUsers(nextPage)
}

// --- Artwork moderation ---
async function loadArtworks(nextPage = 1) {
  loadingArtworks.value = true
  error.value = ''
  try {
    const params = { limit: 20, page: nextPage }
    if (artworkQuery.value.trim()) params.q = artworkQuery.value.trim()
    const { data } = await adminApi.getArtworks(params)
    artworks.value = data?.artworks || []
    artworkPagination.value = {
      page: data?.page || nextPage,
      pages: data?.pages || 1,
      total: data?.total || 0,
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load artworks'
    artworks.value = []
    artworkPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingArtworks.value = false
  }
}

async function removeArtwork(artworkId) {
  if (mutating.value) return
  const shouldDelete = window.confirm('Delete this artwork? This action cannot be undone.')
  if (!shouldDelete) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.deleteArtwork(artworkId)
    artworks.value = artworks.value.filter((item) => item._id !== artworkId)
    await loadOverview()
  } catch (deleteError) {
    error.value = deleteError?.response?.data?.message || 'Failed to delete artwork'
  } finally {
    mutating.value = false
  }
}

function toggleArtworkFilters() { artworkPanelFiltersOpen.value = !artworkPanelFiltersOpen.value }

async function goToArtworkPage(nextPage) {
  if (nextPage < 1 || nextPage > artworkPagination.value.pages || loadingArtworks.value) return
  await loadArtworks(nextPage)
}

// --- Comment moderation ---
async function loadComments(nextPage = 1) {
  loadingComments.value = true
  error.value = ''
  try {
    const params = { limit: 20, page: nextPage }
    if (commentQuery.value.trim()) params.q = commentQuery.value.trim()
    const { data } = await adminApi.getComments(params)
    comments.value = data?.comments || []
    commentPagination.value = {
      page: data?.page || nextPage,
      pages: data?.pages || 1,
      total: data?.total || 0,
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load comments'
    comments.value = []
    commentPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingComments.value = false
  }
}

async function removeComment(commentId) {
  if (mutating.value) return
  const shouldDelete = window.confirm('Delete this comment? This action cannot be undone.')
  if (!shouldDelete) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.deleteComment(commentId)
    comments.value = comments.value.filter((item) => item._id !== commentId)
    await loadOverview()
  } catch (deleteError) {
    error.value = deleteError?.response?.data?.message || 'Failed to delete comment'
  } finally {
    mutating.value = false
  }
}

function toggleCommentFilters() { commentPanelFiltersOpen.value = !commentPanelFiltersOpen.value }

async function goToCommentPage(nextPage) {
  if (nextPage < 1 || nextPage > commentPagination.value.pages || loadingComments.value) return
  await loadComments(nextPage)
}

// --- Payment management ---
async function loadPayments(nextPage = 1) {
  loadingPayments.value = true
  error.value = ''
  try {
    const params = { limit: 20, page: nextPage }
    if (paymentStatusFilter.value !== 'all') params.status = paymentStatusFilter.value
    const { data } = await adminApi.getPayments(params)
    payments.value = data?.payments || []
    paymentPagination.value = {
      page: data?.page || nextPage,
      pages: data?.pages || 1,
      total: data?.total || 0,
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load payments'
    payments.value = []
    paymentPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingPayments.value = false
  }
}

function togglePaymentFilters() { paymentPanelFiltersOpen.value = !paymentPanelFiltersOpen.value }

async function goToPaymentPage(nextPage) {
  if (nextPage < 1 || nextPage > paymentPagination.value.pages || loadingPayments.value) return
  await loadPayments(nextPage)
}

// --- Report review ---
async function loadReports(nextPage = 1) {
  loadingReports.value = true
  error.value = ''
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
    error.value = fetchError?.response?.data?.message || 'Failed to load reports'
    reports.value = []
    reportPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingReports.value = false
  }
}

async function resolveReport(requestId) {
  if (mutating.value) return
  const shouldResolve = window.confirm('Dismiss all reports for this request?')
  if (!shouldResolve) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.resolveReport(requestId, { action: 'dismiss' })
    reports.value = reports.value.filter((r) => r.request?._id !== requestId)
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to resolve report'
  } finally {
    mutating.value = false
  }
}

async function goToReportPage(nextPage) {
  if (nextPage < 1 || nextPage > reportPagination.value.pages || loadingReports.value) return
  await loadReports(nextPage)
}

// --- Artwork report review ---
async function loadArtworkReports(nextPage = 1) {
  loadingArtworkReports.value = true
  error.value = ''
  try {
    const params = { limit: 20, page: nextPage, status: reportStatusFilter.value }
    const { data } = await adminApi.getReportedArtworks(params)
    artworkReports.value = data?.reports || []
    artworkReportPagination.value = {
      page: data?.page || nextPage,
      pages: data?.pages || 1,
      total: data?.total || 0,
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load artwork reports'
    artworkReports.value = []
    artworkReportPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingArtworkReports.value = false
  }
}

async function resolveArtworkReport(reportId) {
  if (mutating.value) return
  const note = window.prompt('Resolution note (optional):')
  if (note === null) return // cancelled
  mutating.value = true
  error.value = ''
  try {
    await adminApi.resolveArtworkReport(reportId, { action: 'dismiss', note: note || '' })
    artworkReports.value = artworkReports.value.filter((r) => r._id !== reportId)
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to resolve report'
  } finally {
    mutating.value = false
  }
}

async function hideArtworkFromReport(artworkId, reportId) {
  if (mutating.value) return
  const shouldHide = window.confirm('Hide this artwork? The owner will be notified.')
  if (!shouldHide) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.hideArtwork(artworkId, { reason: 'Violated platform guidelines after being reported' })
    artworkReports.value = artworkReports.value.filter((r) => r._id !== reportId)
    await loadOverview()
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to hide artwork'
  } finally {
    mutating.value = false
  }
}

async function goToArtworkReportPage(nextPage) {
  if (nextPage < 1 || nextPage > artworkReportPagination.value.pages || loadingArtworkReports.value) return
  await loadArtworkReports(nextPage)
}

// --- Hidden artworks ---
async function loadHiddenArtworks(nextPage = 1) {
  loadingHiddenArtworks.value = true
  error.value = ''
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
    error.value = fetchError?.response?.data?.message || 'Failed to load hidden artworks'
    hiddenArtworks.value = []
    hiddenArtworkPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingHiddenArtworks.value = false
  }
}

async function unhideArtwork(artworkId) {
  if (mutating.value) return
  const shouldUnhide = window.confirm('Unhide this artwork? It will become visible to all users.')
  if (!shouldUnhide) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.unhideArtwork(artworkId)
    hiddenArtworks.value = hiddenArtworks.value.filter((a) => a._id !== artworkId)
    await loadOverview()
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to unhide artwork'
  } finally {
    mutating.value = false
  }
}

async function goToHiddenArtworkPage(nextPage) {
  if (nextPage < 1 || nextPage > hiddenArtworkPagination.value.pages || loadingHiddenArtworks.value) return
  await loadHiddenArtworks(nextPage)
}

// --- Tag management ---
async function loadTags(nextPage = 1) {
  loadingTags.value = true
  error.value = ''
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
    error.value = fetchError?.response?.data?.message || 'Failed to load tags'
    tags.value = []
    tagPagination.value = { page: 1, pages: 1, total: 0 }
  } finally {
    loadingTags.value = false
  }
}

async function deleteTag(tagId) {
  if (mutating.value) return
  const shouldDelete = window.confirm('Delete this tag? It will be removed from all artworks.')
  if (!shouldDelete) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.deleteTag(tagId)
    tags.value = tags.value.filter((t) => t._id !== tagId)
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to delete tag'
  } finally {
    mutating.value = false
  }
}

async function mergeTags({ sourceId, targetId }) {
  if (mutating.value) return
  mutating.value = true
  error.value = ''
  try {
    await adminApi.mergeTags({ sourceId, targetId })
    await loadTags(tagPagination.value.page || 1)
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to merge tags'
  } finally {
    mutating.value = false
  }
}

function toggleTagFilters() { tagPanelFiltersOpen.value = !tagPanelFiltersOpen.value }

async function goToTagPage(nextPage) {
  if (nextPage < 1 || nextPage > tagPagination.value.pages || loadingTags.value) return
  await loadTags(nextPage)
}

// --- Global ---
async function refreshAll() {
  await Promise.all([
    loadOverview(),
    loadUsers(userPagination.value.page || 1),
    loadArtworks(artworkPagination.value.page || 1),
  ])
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(async () => {
  if (!isAdmin.value) return
  await Promise.all([loadOverview(), loadUsers(1), loadArtworks(1), loadArtworkReports(1), loadHiddenArtworks(1)])
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="!authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Admin Management</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>

    <section v-else-if="!isAdmin" class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Admin Management</h1>
      <p class="text-danger mb-0">You do not have permission to access this page.</p>
    </section>

    <section v-else class="admin-page page-block">
      <header class="admin-head">
        <h1>Admin Management Hub</h1>
        <p>Manage users, monitor key metrics, and moderate content.</p>
        <button
          class="btn btn-sm btn-admin-refresh"
          :disabled="loadingOverview || loadingUsers || loadingArtworks || mutating"
          @click="refreshAll"
        >
          Refresh all
        </button>
      </header>

      <p v-if="error" class="error-note">{{ error }}</p>

      <AdminOverviewCards :overview="overview" :loading-overview="loadingOverview" />

      <AdminSectionTabs :active-tab="activeTab" :tabs="adminTabs" @change-tab="activeTab = $event" />

      <AdminUserManagementPanel
        :active-tab="activeTab"
        :user-panel-filters-open="userPanelFiltersOpen"
        :user-query="userQuery"
        :user-role-filter="userRoleFilter"
        :loading-users="loadingUsers"
        :mutating="mutating"
        :users="users"
        :user-pagination="userPagination"
        :format-date="formatDate"
        @toggle-filters="toggleUserFilters"
        @update:user-query="userQuery = $event"
        @update:user-role-filter="userRoleFilter = $event"
        @apply-filters="loadUsers(1)"
        @set-user-role="setUserRole"
        @go-page="goToUserPage"
      />

      <AdminArtworkModerationPanel
        :active-tab="activeTab"
        :artwork-panel-filters-open="artworkPanelFiltersOpen"
        :artwork-query="artworkQuery"
        :loading-artworks="loadingArtworks"
        :mutating="mutating"
        :artworks="artworks"
        :artwork-pagination="artworkPagination"
        :format-date="formatDate"
        @toggle-filters="toggleArtworkFilters"
        @update:artwork-query="artworkQuery = $event"
        @apply-filters="loadArtworks(1)"
        @remove-artwork="removeArtwork"
        @go-page="goToArtworkPage"
      />

      <AdminArtworkReportPanel
        :active-tab="activeTab"
        :artwork-reports="artworkReports"
        :loading-reports="loadingArtworkReports"
        :mutating="mutating"
        :report-pagination="artworkReportPagination"
        :report-status-filter="reportStatusFilter"
        :format-date="formatDate"
        @resolve-report="resolveArtworkReport"
        @hide-artwork="hideArtworkFromReport"
        @go-page="goToArtworkReportPage"
        @update:report-status-filter="reportStatusFilter = $event; loadArtworkReports(1)"
      />

      <AdminCommentModerationPanel
        :active-tab="activeTab"
        :comment-panel-filters-open="commentPanelFiltersOpen"
        :comment-query="commentQuery"
        :loading-comments="loadingComments"
        :mutating="mutating"
        :comments="comments"
        :comment-pagination="commentPagination"
        :format-date="formatDate"
        @toggle-filters="toggleCommentFilters"
        @update:comment-query="commentQuery = $event"
        @apply-filters="loadComments(1)"
        @delete-comment="removeComment"
        @go-page="goToCommentPage"
      />

      <AdminHiddenArtworksPanel
        :active-tab="activeTab"
        :hidden-artworks="hiddenArtworks"
        :loading-hidden="loadingHiddenArtworks"
        :mutating="mutating"
        :hidden-pagination="hiddenArtworkPagination"
        :format-date="formatDate"
        @unhide-artwork="unhideArtwork"
        @go-page="goToHiddenArtworkPage"
      />

      <AdminReportReviewPanel
        :active-tab="activeTab"
        :loading-reports="loadingReports"
        :mutating="mutating"
        :reports="reports"
        :report-pagination="reportPagination"
        :format-date="formatDate"
        @resolve-report="resolveReport"
        @go-page="goToReportPage"
      />

      <AdminTagManagementPanel
        :active-tab="activeTab"
        :tag-panel-filters-open="tagPanelFiltersOpen"
        :tag-query="tagQuery"
        :loading-tags="loadingTags"
        :mutating="mutating"
        :tags="tags"
        :tag-pagination="tagPagination"
        :format-date="formatDate"
        @toggle-filters="toggleTagFilters"
        @update:tag-query="tagQuery = $event"
        @apply-filters="loadTags(1)"
        @delete-tag="deleteTag"
        @merge-tags="mergeTags"
        @go-page="goToTagPage"
      />

      <AdminAISettingsPanel
        :active-tab="activeTab"
      />
    </section>
  </MainLayoutTemplate>
</template>

<style src="../styles/admin-management.css"></style>
