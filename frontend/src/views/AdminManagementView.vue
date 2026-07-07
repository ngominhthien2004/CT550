<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import {
  AdminOverviewCards, AdminSectionTabs,
  AdminUserManagementPanel,
  AdminArtworkManagementPanel,
  AdminTagManagementPanel,
  AdminAISettingsPanel,
  AdminReportPanel, AdminHiddenArtworksPanel,
  AdminConfirmModal, AdminPromptModal,
  AdminBannerPanel,
} from '@/components/admin'

import { useAuthStore } from '../stores/auth.store'

import { formatShortDate } from '../utils/date.js'
import { useAdminOverview } from '@/composables/useAdminOverview'
import { useAdminUsers } from '@/composables/useAdminUsers'
import { useAdminArtworks } from '@/composables/useAdminArtworks'
import { useAdminReports } from '@/composables/useAdminReports'
import { useAdminTags } from '@/composables/useAdminTags'
import { useAdminModals } from '@/composables/useAdminModals'

const isNavCollapsed = ref(true)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const error = ref('')
const mutating = ref(false)

// --- Composables ---
const { overview, loadingOverview, loadOverview } = useAdminOverview({ error, mutating })
const {
  userQuery, userRoleFilter, users, userPanelFiltersOpen, userPagination, loadingUsers,
  loadUsers, setUserRole, deleteUser, toggleUserFilters, goToUserPage,
} = useAdminUsers({ error, mutating, authStore, user })
const {
  artworkQuery, artworkTypeFilter, artworks, artworkPanelFiltersOpen, artworkPagination, loadingArtworks,
  loadArtworks, deleteArtwork, toggleArtworkFilters, goToArtworkPage,
} = useAdminArtworks({ error, mutating })
const {
  activeReportTab,
  reportStatusFilter, artworkReports, loadingArtworkReports, artworkReportPagination,
  loadArtworkReports, resolveArtworkReport, hideArtworkFromReport, goToArtworkReportPage,
  hiddenArtworks, loadingHiddenArtworks, hiddenArtworkPagination,
  loadHiddenArtworks, unhideArtwork, goToHiddenArtworkPage,
  commentReports, loadingCommentReports, commentReportPagination, commentReportStatusFilter,
  loadCommentReports, resolveCommentReport, goToCommentReportPage,
  userReports, loadingUserReports, userReportPagination, userReportStatusFilter,
  loadUserReports, resolveUserReport, goToUserReportPage,
} = useAdminReports({ error, mutating })
const {
  tagQuery, tags, tagPanelFiltersOpen, tagPagination, loadingTags,
  loadTags, deleteTag, mergeTags, updateTag, toggleTagFilters, goToTagPage,
} = useAdminTags({ error, mutating })
const {
  confirmModal, promptModal,
  handleConfirm, handleConfirmCancel,
  handlePromptConfirm, handlePromptCancel,
  showConfirm, showPrompt,
} = useAdminModals()

// --- Tab state ---
const activeTab = ref(route.query.tab || 'users')
const adminTabs = [
  { id: 'users', label: 'Users' },
  { id: 'artworks', label: 'Artworks' },
  { id: 'reports', label: 'Reports' },
  { id: 'tags', label: 'Tags' },
  { id: 'ai', label: 'AI Settings' },
  { id: 'banners', label: 'Banners' },
]

// Sync URL query params to tab state
watch(() => route.query, (query) => {
  if (query.tab && adminTabs.some(t => t.id === query.tab)) {
    activeTab.value = query.tab
  }
  if (query.type && ['artwork', 'comment', 'user', 'hidden'].includes(query.type)) {
    activeReportTab.value = query.type
  }
}, { immediate: true })

// --- Modal wrapper functions ---
function handleDeleteTag(tagId) {
  const config = deleteTag(tagId)
  if (config) showConfirm(config)
}

function handleResolveArtworkReport(reportId) {
  const config = resolveArtworkReport(reportId)
  if (config) showPrompt(config)
}

function handleHideArtworkFromReport(artworkId, reportId) {
  const config = hideArtworkFromReport(artworkId, reportId)
  if (config) showConfirm(config)
}

function handleUnhideArtwork(artworkId) {
  const config = unhideArtwork(artworkId)
  if (config) showConfirm(config)
}

function handleResolveCommentReport(reportId, action) {
  const config = resolveCommentReport(reportId, action)
  if (config) showPrompt(config)
}

function handleResolveUserReport(reportId, action) {
  const config = resolveUserReport(reportId, action)
  if (config) showPrompt(config)
}

function handleDeleteUser(targetUser) {
  const config = deleteUser(targetUser)
  if (config) showConfirm(config)
}

function handleDeleteArtwork(targetArtwork) {
  const config = deleteArtwork(targetArtwork)
  if (config) showConfirm(config)
}

// --- UI utilities ---
function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function goLogin() {
  await router.push('/login')
}

async function refreshAll() {
  await Promise.all([
    loadOverview(),
    loadUsers(userPagination.value.page || 1),
    loadArtworks(artworkPagination.value.page || 1),
  ])
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  return formatShortDate(dateValue)
}

onMounted(async () => {
  if (!isAdmin.value) return
  await Promise.all([
    loadOverview(), loadUsers(1), loadArtworks(1),
    loadArtworkReports(1), loadHiddenArtworks(1),
    loadCommentReports(1), loadUserReports(1), loadTags(1),
  ])
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="!authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Admin Management</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button type="button" class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>

    <section v-else-if="!isAdmin" class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Admin Management</h1>
      <p class="text-danger mb-0">You do not have permission to access this page.</p>
    </section>

    <section v-else class="admin-page page-block">
      <header class="admin-head">
        <h1>Admin Management Hub</h1>
        <p>Manage users, monitor key metrics, and moderate content.</p>
        <button type="button"
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

      <!-- Report sub-filters -->
      <div v-if="activeTab === 'reports'" class="sub-filter-bar">
        <button type="button" class="sub-filter-btn" :class="{ active: activeReportTab === 'artwork' }" @click="activeReportTab = 'artwork'">Artwork</button>
        <button type="button" class="sub-filter-btn" :class="{ active: activeReportTab === 'comment' }" @click="activeReportTab = 'comment'">Comment</button>
        <button type="button" class="sub-filter-btn" :class="{ active: activeReportTab === 'user' }" @click="activeReportTab = 'user'">User</button>
        <button type="button" class="sub-filter-btn" :class="{ active: activeReportTab === 'hidden' }" @click="activeReportTab = 'hidden'">Hidden</button>
      </div>

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
        @delete-user="handleDeleteUser"
        @go-page="goToUserPage"
      />

      <AdminArtworkManagementPanel
        :active-tab="activeTab"
        :artwork-panel-filters-open="artworkPanelFiltersOpen"
        :artwork-query="artworkQuery"
        :artwork-type-filter="artworkTypeFilter"
        :loading-artworks="loadingArtworks"
        :mutating="mutating"
        :artworks="artworks"
        :artwork-pagination="artworkPagination"
        :format-date="formatDate"
        @toggle-filters="toggleArtworkFilters"
        @update:artwork-query="artworkQuery = $event"
        @update:artwork-type-filter="artworkTypeFilter = $event"
        @apply-filters="loadArtworks(1)"
        @delete-artwork="handleDeleteArtwork"
        @go-page="goToArtworkPage"
      />

      <AdminReportPanel
        v-if="activeTab === 'reports'"
        :active-tab="activeReportTab"
        report-type="artwork"
        :reports="artworkReports"
        :loading-reports="loadingArtworkReports"
        :mutating="mutating"
        :report-pagination="artworkReportPagination"
        :report-status-filter="reportStatusFilter"
        :format-date="formatDate"
        @resolve-report="handleResolveArtworkReport"
        @hide-artwork="handleHideArtworkFromReport"
        @go-page="goToArtworkReportPage"
        @update:report-status-filter="reportStatusFilter = $event; loadArtworkReports(1)"
      />

      <AdminHiddenArtworksPanel
        v-if="activeTab === 'reports'"
        :active-tab="activeReportTab"
        :hidden-artworks="hiddenArtworks"
        :loading-hidden="loadingHiddenArtworks"
        :mutating="mutating"
        :hidden-pagination="hiddenArtworkPagination"
        :format-date="formatDate"
        @unhide-artwork="handleUnhideArtwork"
        @go-page="goToHiddenArtworkPage"
      />

      <AdminReportPanel
        v-if="activeTab === 'reports'"
        :active-tab="activeReportTab"
        report-type="comment"
        :reports="commentReports"
        :loading-reports="loadingCommentReports"
        :mutating="mutating"
        :report-pagination="commentReportPagination"
        :report-status-filter="commentReportStatusFilter"
        :format-date="formatDate"
        @resolve-report="handleResolveCommentReport"
        @go-page="goToCommentReportPage"
        @update:report-status-filter="commentReportStatusFilter = $event; loadCommentReports(1)"
      />

      <AdminReportPanel
        v-if="activeTab === 'reports'"
        :active-tab="activeReportTab"
        report-type="user"
        :reports="userReports"
        :loading-reports="loadingUserReports"
        :mutating="mutating"
        :report-pagination="userReportPagination"
        :report-status-filter="userReportStatusFilter"
        :format-date="formatDate"
        @resolve-report="handleResolveUserReport"
        @go-page="goToUserReportPage"
        @update:report-status-filter="userReportStatusFilter = $event; loadUserReports(1)"
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
        @delete-tag="handleDeleteTag"
        @merge-tags="mergeTags"
        @edit-tag="updateTag"
        @go-page="goToTagPage"
      />

      <AdminAISettingsPanel
        :active-tab="activeTab"
      />

      <AdminBannerPanel
        :active-tab="activeTab"
      />
    </section>

    <AdminConfirmModal
      :show="confirmModal.show"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-label="confirmModal.confirmLabel"
      :confirm-class="confirmModal.confirmClass"
      @confirm="handleConfirm"
      @cancel="handleConfirmCancel"
    />

    <AdminPromptModal
      :show="promptModal.show"
      :title="promptModal.title"
      :message="promptModal.message"
      :placeholder="promptModal.placeholder"
      :default-value="promptModal.defaultValue"
      :confirm-label="promptModal.confirmLabel"
      @confirm="handlePromptConfirm"
      @cancel="handlePromptCancel"
    />
  </MainLayoutTemplate>
</template>

<style src="../styles/admin-management.css"></style>

<style scoped>
.sub-filter-bar {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.sub-filter-btn {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.sub-filter-btn:hover {
  color: var(--text);
  border-color: var(--muted);
}

.sub-filter-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
</style>
