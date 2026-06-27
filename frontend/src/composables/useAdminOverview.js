import { ref } from 'vue'
import { adminApi } from '../services/api'

export function useAdminOverview({ error, mutating } = {}) {
  const overview = ref({
    totalUsers: 0,
    totalAdmins: 0,
    totalArtworks: 0,
    totalComments: 0,
  })
  const loadingOverview = ref(false)

  async function loadOverview() {
    loadingOverview.value = true
    try {
      const { data } = await adminApi.getOverview()
      overview.value = { ...overview.value, ...data }
    } catch (fetchError) {
      if (error) error.value = fetchError?.response?.data?.message || 'Failed to load admin overview'
    } finally {
      loadingOverview.value = false
    }
  }

  return { overview, loadingOverview, loadOverview }
}
