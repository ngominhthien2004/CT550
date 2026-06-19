<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '@/stores/auth.store'
import { reportApi, adminApi } from '@/services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const caseDetail = ref(null)
const loading = ref(false)
const error = ref('')
const actionLoading = ref(false)
const actionError = ref('')
const actionSuccess = ref('')
const resolutionNote = ref('')
const showResolveConfirm = ref(false)
const showDismissConfirm = ref(false)
const showDeleteCommentConfirm = ref(false)

const reportType = computed(() => route.params.type)
const reportId = computed(() => route.params.id)

const isPending = computed(() => {
  const status = caseDetail.value?.report?.status || caseDetail.value?.report?.status || ''
  return status.toLowerCase() === 'pending'
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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
  return formatDate(dateStr)
}

const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'resolved') return 'badge bg-success'
  if (s === 'dismissed') return 'badge bg-secondary'
  return 'badge bg-warning text-dark'
}

const typeBadgeClass = (type) => {
  const t = (type || '').toLowerCase()
  if (t === 'artwork') return 'badge bg-primary'
  if (t === 'comment') return 'badge bg-info'
  if (t === 'user') return 'badge bg-warning text-dark'
  return 'badge bg-secondary'
}

async function loadCaseDetail() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await reportApi.getModerationCaseDetail({
      type: reportType.value,
      id: reportId.value,
    })
    caseDetail.value = data || null
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load case detail'
    caseDetail.value = null
  } finally {
    loading.value = false
  }
}

async function resolveCase(action = 'resolved') {
  actionLoading.value = true
  actionError.value = ''
  actionSuccess.value = ''
  try {
    const payload = {
      action,
      note: resolutionNote.value || '',
    }

    if (reportType.value === 'comment') {
      await reportApi.resolveCommentReport(reportId.value, payload)
    } else if (reportType.value === 'user') {
      await reportApi.resolveUserReport(reportId.value, payload)
    } else if (reportType.value === 'artwork') {
      await adminApi.resolveArtworkReport(reportId.value, payload)
    }

    actionSuccess.value = `Report ${action === 'resolved' ? 'resolved' : 'dismissed'} successfully.`
    showResolveConfirm.value = false
    showDismissConfirm.value = false
    await loadCaseDetail()
  } catch (err) {
    actionError.value = err?.response?.data?.message || `Failed to ${action} report`
  } finally {
    actionLoading.value = false
  }
}

async function deleteCommentAndResolve() {
  actionLoading.value = true
  actionError.value = ''
  actionSuccess.value = ''
  try {
    const commentId = caseDetail.value?.report?.target?._id
    if (commentId) {
      await adminApi.deleteComment(commentId)
    }
    await reportApi.resolveCommentReport(reportId.value, {
      action: 'resolved',
      note: resolutionNote.value || 'Comment deleted by admin.',
    })
    actionSuccess.value = 'Comment deleted and report resolved.'
    showDeleteCommentConfirm.value = false
    await loadCaseDetail()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to delete comment and resolve'
  } finally {
    actionLoading.value = false
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function goBack() {
  router.push('/admin')
}

onMounted(() => {
  if (authStore.isAuthenticated && authStore.user?.role === 'admin') {
    loadCaseDetail()
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="!authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Moderation Case Detail</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button type="button" class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>

    <section v-else-if="authStore.user?.role !== 'admin'" class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Moderation Case Detail</h1>
      <p class="text-danger mb-0">You do not have permission to access this page.</p>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-3">
      <!-- Header -->
      <header class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex align-items-center gap-3">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="goBack">
            <i class="fa-solid fa-arrow-left me-1"></i>Back
          </button>
          <div>
            <h1 class="h4 mb-1">Moderation Case Detail</h1>
            <p class="text-secondary mb-0">
              <span :class="typeBadgeClass(reportType)">{{ reportType.toUpperCase() }}</span>
              Report #{{ reportId }}
            </p>
          </div>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadCaseDetail" :disabled="loading">
          <i class="fa-solid fa-rotate me-1"></i>Refresh
        </button>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Error -->
      <p v-else-if="error" class="text-danger mb-0">{{ error }}</p>

      <!-- Case Detail -->
      <template v-else-if="caseDetail">
        <div class="row g-3">
          <!-- Report Info Card -->
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-grid gap-3">
                <h5 class="card-title fw-bold mb-0">
                  <i class="fa-regular fa-flag me-2"></i>Report Information
                </h5>

                <div class="d-grid gap-2">
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Status</div>
                    <div class="col-sm-8">
                      <span :class="statusBadgeClass(caseDetail.report?.status || caseDetail.status)">
                        {{ ((caseDetail.report?.status || caseDetail.status) || 'pending').toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Type</div>
                    <div class="col-sm-8">
                      <span :class="typeBadgeClass(reportType)">{{ reportType.toUpperCase() }}</span>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Reason</div>
                    <div class="col-sm-8 text-capitalize">{{ caseDetail.report?.reason || caseDetail.reason || '-' }}</div>
                  </div>
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Description</div>
                    <div class="col-sm-8">{{ caseDetail.report?.description || caseDetail.description || '-' }}</div>
                  </div>
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Created</div>
                    <div class="col-sm-8" :title="formatDate(caseDetail.report?.createdAt || caseDetail.createdAt)">
                      {{ timeAgo(caseDetail.report?.createdAt || caseDetail.createdAt) }}
                    </div>
                  </div>
                  <div v-if="caseDetail.report?.resolvedAt || caseDetail.resolvedAt" class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Resolved</div>
                    <div class="col-sm-8" :title="formatDate(caseDetail.report?.resolvedAt || caseDetail.resolvedAt)">
                      {{ timeAgo(caseDetail.report?.resolvedAt || caseDetail.resolvedAt) }}
                    </div>
                  </div>
                  <div v-if="caseDetail.report?.resolutionNote || caseDetail.resolutionNote" class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Resolution Note</div>
                    <div class="col-sm-8">{{ caseDetail.report?.resolutionNote || caseDetail.resolutionNote }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reporter Info Card -->
            <div class="card border-0 shadow-sm mt-3">
              <div class="card-body d-grid gap-3">
                <h5 class="card-title fw-bold mb-0">
                  <i class="fa-regular fa-user me-2"></i>Reporter
                </h5>
                <div class="d-grid gap-2">
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Username</div>
                    <div class="col-sm-8">{{ caseDetail.reporter?.username || '-' }}</div>
                  </div>
                  <div class="row">
                    <div class="col-sm-4 text-muted small fw-semibold">Display Name</div>
                    <div class="col-sm-8">{{ caseDetail.reporter?.displayName || '-' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Target Info Card -->
            <div class="card border-0 shadow-sm mt-3">
              <div class="card-body d-grid gap-3">
                <h5 class="card-title fw-bold mb-0">
                  <i class="fa-regular fa-rectangle-ad me-2"></i>Target
                </h5>
                <div class="d-grid gap-2">
                  <!-- Artwork target -->
                  <template v-if="reportType === 'artwork'">
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Title</div>
                      <div class="col-sm-8">
                        <router-link :to="`/artworks/${caseDetail.report?.target?._id}`">
                          {{ caseDetail.report?.target?.title || 'Untitled' }}
                        </router-link>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Author</div>
                      <div class="col-sm-8">{{ caseDetail.report?.target?.user?.displayName || caseDetail.report?.target?.user?.username || '-' }}</div>
                    </div>
                  </template>

                  <!-- Comment target -->
                  <template v-else-if="reportType === 'comment'">
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Content</div>
                      <div class="col-sm-8">{{ caseDetail.report?.target?.content || '-' }}</div>
                    </div>
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Author</div>
                      <div class="col-sm-8">{{ caseDetail.report?.target?.user?.displayName || caseDetail.report?.target?.user?.username || '-' }}</div>
                    </div>
                  </template>

                  <!-- User target -->
                  <template v-else-if="reportType === 'user'">
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Username</div>
                      <div class="col-sm-8">{{ caseDetail.report?.target?.username || caseDetail.target?.username || '-' }}</div>
                    </div>
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Display Name</div>
                      <div class="col-sm-8">{{ caseDetail.report?.target?.displayName || caseDetail.target?.displayName || '-' }}</div>
                    </div>
                    <div class="row">
                      <div class="col-sm-4 text-muted small fw-semibold">Profile</div>
                      <div class="col-sm-8">
                        <router-link :to="`/account?user=${caseDetail.report?.target?._id || caseDetail.target?._id}`">
                          View Profile
                        </router-link>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Admin Actions Card -->
          <div class="col-lg-4">
            <div v-if="isPending" class="card border-0 shadow-sm">
              <div class="card-body d-grid gap-3">
                <h5 class="card-title fw-bold mb-0">
                  <i class="fa-solid fa-gavel me-2"></i>Admin Actions
                </h5>

                <p v-if="actionError" class="text-danger small mb-0">{{ actionError }}</p>
                <p v-if="actionSuccess" class="text-success small mb-0">{{ actionSuccess }}</p>

                <div class="form-group">
                  <label class="small fw-semibold text-muted">Resolution Note (optional)</label>
                  <textarea v-model="resolutionNote" class="form-control form-control-sm" rows="3" placeholder="Add a resolution note..."></textarea>
                </div>

                <!-- Resolve -->
                <div v-if="!showResolveConfirm">
                  <button type="button"
                    class="btn btn-success w-100"
                    :disabled="actionLoading"
                    @click="showResolveConfirm = true"
                  >
                    <i class="fa-solid fa-check me-1"></i>Resolve Report
                  </button>
                </div>
                <div v-else class="d-grid gap-2">
                  <p class="small text-muted mb-0">Resolve this report?</p>
                  <div class="d-flex gap-2">
                    <button type="button" class="btn btn-success btn-sm flex-grow-1" :disabled="actionLoading" @click="resolveCase('resolved')">
                      {{ actionLoading ? 'Processing...' : 'Confirm Resolve' }}
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="actionLoading" @click="showResolveConfirm = false">
                      Cancel
                    </button>
                  </div>
                </div>

                <!-- Dismiss -->
                <div v-if="!showDismissConfirm">
                  <button type="button"
                    class="btn btn-outline-secondary w-100"
                    :disabled="actionLoading"
                    @click="showDismissConfirm = true"
                  >
                    <i class="fa-solid fa-xmark me-1"></i>Dismiss Report
                  </button>
                </div>
                <div v-else class="d-grid gap-2">
                  <p class="small text-muted mb-0">Dismiss this report without action?</p>
                  <div class="d-flex gap-2">
                    <button type="button" class="btn btn-secondary btn-sm flex-grow-1" :disabled="actionLoading" @click="resolveCase('dismissed')">
                      {{ actionLoading ? 'Processing...' : 'Confirm Dismiss' }}
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="actionLoading" @click="showDismissConfirm = false">
                      Cancel
                    </button>
                  </div>
                </div>

                <hr />

                <!-- Comment-specific: Delete Comment + Resolve -->
                <template v-if="reportType === 'comment'">
                  <div v-if="!showDeleteCommentConfirm">
                    <button type="button"
                      class="btn btn-danger w-100"
                      :disabled="actionLoading"
                      @click="showDeleteCommentConfirm = true"
                    >
                      <i class="fa-solid fa-trash-can me-1"></i>Delete Comment &amp; Resolve
                    </button>
                  </div>
                  <div v-else class="d-grid gap-2">
                    <p class="small text-danger mb-0 fw-semibold">Delete this comment and resolve the report? This cannot be undone.</p>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-danger btn-sm flex-grow-1" :disabled="actionLoading" @click="deleteCommentAndResolve">
                        {{ actionLoading ? 'Processing...' : 'Confirm Delete & Resolve' }}
                      </button>
                      <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="actionLoading" @click="showDeleteCommentConfirm = false">
                        Cancel
                      </button>
                    </div>
                  </div>
                </template>

                <!-- User-specific actions -->
                <template v-if="reportType === 'user'">
                  <button type="button" class="btn btn-warning w-100" disabled title="Coming soon">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>Warn User (Coming soon)
                  </button>
                  <button type="button" class="btn btn-danger w-100" disabled title="Coming soon">
                    <i class="fa-solid fa-ban me-1"></i>Suspend User (Coming soon)
                  </button>
                </template>
              </div>
            </div>

            <!-- Already resolved info -->
            <div v-else class="card border-0 shadow-sm">
              <div class="card-body text-center d-grid gap-2">
                <i class="fa-regular fa-circle-check fa-2x text-success"></i>
                <p class="fw-semibold mb-0">This report has been resolved.</p>
                <p class="small text-muted mb-0">
                  Status: <span :class="statusBadgeClass(caseDetail.report?.status || caseDetail.status)">
                    {{ ((caseDetail.report?.status || caseDetail.status) || 'unknown').toUpperCase() }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Not found -->
      <p v-else class="text-muted mb-0">No case details found.</p>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.card {
  border-radius: 12px;
}
.card-title {
  font-size: 1rem;
}
.row > .col-sm-4 {
  font-size: 0.85rem;
}
.row > .col-sm-8 {
  font-size: 0.9rem;
}
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3em 0.6em;
}
.btn {
  border-radius: 8px;
}
hr {
  opacity: 0.15;
}
</style>
