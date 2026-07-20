<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '@/stores/auth.store'
import { reportApi } from '@/services/api'

const { t } = useI18n()
const isNavCollapsed = ref(true)
const router = useRouter()
const authStore = useAuthStore()

const reports = ref([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const LIMIT = 20

async function loadReports(nextPage = 1) {
  loading.value = true
  error.value = ''
  try {
    const { data } = await reportApi.getMyReports({ page: nextPage, limit: LIMIT })
    const items = data?.reports || data?.results || data || []
    reports.value = Array.isArray(items) ? items : []
    page.value = data?.page || nextPage
    totalPages.value = data?.pages || 1
    total.value = data?.total || reports.value.length
  } catch (err) {
    error.value = err?.response?.data?.message || t('report.loadFailed')
    reports.value = []
  } finally {
    loading.value = false
  }
}

function goToPage(p) {
  if (p >= 1 && p <= totalPages.value) {
    loadReports(p)
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getTargetLabel(report) {
  const target = report?.target
  const type = report?.targetType || report?.type || ''
  if (!target) return t('common.unknown')
  if (type === 'artwork') return target.title || 'Untitled Artwork'
  if (type === 'comment') {
    const content = target.content || ''
    return content.length > 80 ? content.slice(0, 80) + '...' : content
  }
  if (type === 'user') return target?.displayName || target?.username || t('common.unknown')
  return t('common.unknown')
}

function getTargetLink(report) {
  const target = report?.target
  const type = report?.targetType || report?.type || ''
  if (!target) return null
  if (type === 'artwork') return `/artworks/${target._id}`
  if (type === 'user') return `/account?user=${target._id}`
  return null
}

const typeBadgeClass = (type) => {
  const t = (type || '').toLowerCase()
  if (t === 'artwork') return 'badge bg-primary'
  if (t === 'comment') return 'badge bg-info'
  if (t === 'user') return 'badge bg-warning text-dark'
  return 'badge bg-secondary'
}

const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'resolved') return 'badge bg-success'
  if (s === 'dismissed') return 'badge bg-secondary'
  return 'badge bg-warning text-dark'
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function goLogin() {
  await router.push('/login')
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadReports(1)
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-3">
      <header class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 class="h4 mb-1">
            <i class="fa-regular fa-flag me-2"></i>{{ $t('report.myReports') }}
          </h1>
          <p class="text-secondary mb-0">Track the status of reports you've submitted</p>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadReports(page)" :disabled="loading">
          <i class="fa-solid fa-rotate me-1"></i>Refresh
        </button>
      </header>

      <p v-if="error" class="text-danger mb-0">{{ error }}</p>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ $t('common.loading') }}</span>
        </div>
      </div>

      <div v-else-if="reports.length === 0" class="text-center py-5">
        <i class="fa-regular fa-flag fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">{{ $t('report.noReports') }}</h4>
        <p class="text-muted">You haven't submitted any reports yet.</p>
      </div>

      <div v-else class="d-grid gap-2">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Type</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Resolution Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report._id">
                <td>
                  <span :class="typeBadgeClass(report.targetType || report.type)">
                    {{ (report.targetType || report.type || 'unknown').toUpperCase() }}
                  </span>
                </td>
                <td>
                  <router-link
                    v-if="getTargetLink(report)"
                    :to="getTargetLink(report)"
                    class="text-truncate d-inline-block"
                    style="max-width: 200px;"
                  >
                    {{ getTargetLabel(report) }}
                  </router-link>
                  <span v-else class="text-muted">{{ getTargetLabel(report) }}</span>
                </td>
                <td>
                  <span class="text-capitalize">{{ report.reason || '-' }}</span>
                </td>
                <td>
                  <span :class="statusBadgeClass(report.status)">
                    {{ (report.status || 'pending').toUpperCase() }}
                  </span>
                </td>
                <td class="text-nowrap small" :title="formatDate(report.createdAt)">
                  {{ timeAgo(report.createdAt) }}
                </td>
                <td class="small text-muted" style="max-width: 200px;">
                  <span class="text-truncate d-inline-block" v-if="report.resolutionNote">
                    {{ report.resolutionNote }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="mt-2">
          <ul class="pagination justify-content-center pagination-sm">
            <li class="page-item" :class="{ disabled: page <= 1 }">
              <button type="button" class="page-link" @click="goToPage(page - 1)">{{ $t('common.previous') }}</button>
            </li>
            <li
              v-for="p in totalPages"
              :key="p"
              class="page-item"
              :class="{ active: p === page }"
            >
              <button type="button" class="page-link" @click="goToPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" :class="{ disabled: page >= totalPages }">
              <button type="button" class="page-link" @click="goToPage(page + 1)">{{ $t('common.next') }}</button>
            </li>
          </ul>
        </nav>
      </div>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">{{ $t('report.myReports') }}</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button type="button" class="btn btn-primary btn-sm justify-self-start" @click="goLogin">{{ $t('auth.loginButton') }}</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.table th {
  font-size: 0.85rem;
  font-weight: 600;
}
.table td {
  font-size: 0.9rem;
}
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3em 0.6em;
}
</style>
