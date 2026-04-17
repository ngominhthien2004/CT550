<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import AdminOverviewCards from '../components/admin/AdminOverviewCards.vue'
import AdminSectionTabs from '../components/admin/AdminSectionTabs.vue'
import AdminUserManagementPanel from '../components/admin/AdminUserManagementPanel.vue'
import AdminArtworkModerationPanel from '../components/admin/AdminArtworkModerationPanel.vue'
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
const mutating = ref(false)
const error = ref('')

const overview = ref({
  totalUsers: 0,
  totalAdmins: 0,
  totalPremium: 0,
  totalArtworks: 0,
  totalComments: 0,
})

const userQuery = ref('')
const userRoleFilter = ref('all')
const users = ref([])
const userPanelFiltersOpen = ref(true)
const userPagination = ref({ page: 1, pages: 1, total: 0 })

const artworkQuery = ref('')
const artworks = ref([])
const artworkPanelFiltersOpen = ref(true)
const artworkPagination = ref({ page: 1, pages: 1, total: 0 })
const activeTab = ref('users')

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

async function loadUsers(nextPage = 1) {
  loadingUsers.value = true
  error.value = ''
  try {
    const params = {
      limit: 20,
      page: nextPage,
    }

    if (userQuery.value.trim()) {
      params.q = userQuery.value.trim()
    }

    if (userRoleFilter.value !== 'all') {
      params.role = userRoleFilter.value
    }

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

async function loadArtworks(nextPage = 1) {
  loadingArtworks.value = true
  error.value = ''
  try {
    const params = {
      limit: 20,
      page: nextPage,
    }

    if (artworkQuery.value.trim()) {
      params.q = artworkQuery.value.trim()
    }

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

async function setUserRole(targetUser, nextRole) {
  if (mutating.value) return
  mutating.value = true
  error.value = ''

  try {
    const { data } = await adminApi.updateUser(targetUser._id, { role: nextRole })
    users.value = users.value.map((item) => (item._id === targetUser._id ? data : item))

    if (targetUser._id === user.value?._id) {
      authStore.user = {
        ...authStore.user,
        role: data.role,
      }
      localStorage.setItem('authUser', JSON.stringify(authStore.user))
    }

    await loadOverview()
  } catch (updateError) {
    error.value = updateError?.response?.data?.message || 'Failed to update user role'
  } finally {
    mutating.value = false
  }
}

async function togglePremium(targetUser) {
  if (mutating.value) return
  mutating.value = true
  error.value = ''

  try {
    const { data } = await adminApi.updateUser(targetUser._id, {
      isPremium: !targetUser.isPremium,
    })
    users.value = users.value.map((item) => (item._id === targetUser._id ? data : item))
    await loadOverview()
  } catch (updateError) {
    error.value = updateError?.response?.data?.message || 'Failed to update premium status'
  } finally {
    mutating.value = false
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

function toggleUserFilters() {
  userPanelFiltersOpen.value = !userPanelFiltersOpen.value
}

function toggleArtworkFilters() {
  artworkPanelFiltersOpen.value = !artworkPanelFiltersOpen.value
}

async function goToUserPage(nextPage) {
  if (nextPage < 1 || nextPage > userPagination.value.pages || loadingUsers.value) {
    return
  }
  await loadUsers(nextPage)
}

async function goToArtworkPage(nextPage) {
  if (nextPage < 1 || nextPage > artworkPagination.value.pages || loadingArtworks.value) {
    return
  }
  await loadArtworks(nextPage)
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
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(async () => {
  if (!isAdmin.value) {
    return
  }

  await Promise.all([loadOverview(), loadUsers(1), loadArtworks(1)])
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
        <p>Manage users, monitor key metrics, and moderate artworks.</p>
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

      <AdminSectionTabs :active-tab="activeTab" @change-tab="activeTab = $event" />

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
        @toggle-premium="togglePremium"
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
    </section>
  </MainLayoutTemplate>
</template>

<style src="../styles/admin-management.css"></style>
