import { ref } from 'vue'
import { adminApi } from '../services/api'

export function useAdminUsers({ error, mutating, authStore, user } = {}) {
  const userQuery = ref('')
  const userRoleFilter = ref('all')
  const users = ref([])
  const userPanelFiltersOpen = ref(true)
  const userPagination = ref({ page: 1, pages: 1, total: 0 })
  const loadingUsers = ref(false)

  async function loadUsers(nextPage = 1) {
    loadingUsers.value = true
    if (error) error.value = ''
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
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load users'
      users.value = []
      userPagination.value = { page: 1, pages: 1, total: 0 }
    } finally {
      loadingUsers.value = false
    }
  }

  async function setUserRole(targetUser, nextRole) {
    if (mutating?.value) return
    if (mutating) mutating.value = true
    if (error) error.value = ''
    try {
      const { data } = await adminApi.updateUser(targetUser._id, { role: nextRole })
      users.value = users.value.map((item) => (item._id === targetUser._id ? data : item))
      if (user?.value && targetUser._id === user.value._id && authStore) {
        authStore.user = { ...authStore.user, role: data.role }
        localStorage.setItem('authUser', JSON.stringify(authStore.user))
      }
    } catch (updateError) {
      if (error) error.value = updateError?.response?.data?.message || 'Failed to update user role'
    } finally {
      if (mutating) mutating.value = false
    }
  }

  function toggleUserFilters() { userPanelFiltersOpen.value = !userPanelFiltersOpen.value }

  async function goToUserPage(nextPage) {
    if (nextPage < 1 || nextPage > userPagination.value.pages || loadingUsers.value) return
    await loadUsers(nextPage)
  }

  return {
    userQuery, userRoleFilter, users, userPanelFiltersOpen, userPagination, loadingUsers,
    loadUsers, setUserRole, toggleUserFilters, goToUserPage,
  }
}
