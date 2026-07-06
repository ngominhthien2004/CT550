<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import RequestListSection from '../components/request/RequestListSection.vue'
import PlansSection from '../components/request/PlansSection.vue'
import CreatePlanForm from '../components/request/CreatePlanForm.vue'
import RequestDetailPanel from '../components/request/RequestDetailPanel.vue'

import { useAuthStore } from '../stores/auth.store'
import { useRequestStore } from '../stores/request.store'

const router = useRouter()
const authStore = useAuthStore()
const requestStore = useRequestStore()
const isNavCollapsed = ref(true)
const activeRole = ref('creator')
const statusFilter = ref('')
const actionError = ref('')
const selectedRequestId = ref(null)
const selectedRequestDetail = ref(null)
const detailLoading = ref(false)
const detailPanelRef = ref(null)
const showCreateForm = ref(false)
const searchQuery = ref('')

const requests = computed(() => requestStore.requests)
const terms = computed(() => requestStore.terms)
const loading = computed(() => requestStore.loading)

const filteredRequests = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return requests.value
  return requests.value.filter(item => (item.title || '').toLowerCase().includes(query))
})

function toggleLeftNav() { isNavCollapsed.value = !isNavCollapsed.value }

function switchRole(role) { activeRole.value = role; loadAll() }

async function loadAll() {
  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: '/requests/manage' } })
    return
  }
  await Promise.all([
    requestStore.fetchTerms({ creator: authStore.user?._id, openOnly: 'false' }),
    requestStore.fetchMine({ role: activeRole.value, status: statusFilter.value || undefined }),
  ])
}

async function runAction(requestId, action, payload = {}) {
  actionError.value = ''
  try {
    await requestStore.transition(requestId, action, payload)
    if (selectedRequestId.value === requestId) {
      selectedRequestDetail.value = await requestStore.fetchById(requestId)
    }
  } catch (error) {
    actionError.value = error?.response?.data?.message || `Failed to ${action} request`
  }
}

async function handleDraftSubmission(formData) {
  actionError.value = ''
  if (!selectedRequestId.value) return
  try {
    await requestStore.submitDraft(selectedRequestId.value, formData)
    selectedRequestDetail.value = await requestStore.fetchById(selectedRequestId.value)
  } catch (e) {
    actionError.value = e?.response?.data?.message || 'Failed to submit draft'
  }
}

async function selectRequest(requestId) {
  if (!requestId) { selectedRequestId.value = null; selectedRequestDetail.value = null; return }
  selectedRequestId.value = requestId
  detailLoading.value = true
  try {
    selectedRequestDetail.value = await requestStore.fetchById(requestId)
  } catch { selectedRequestDetail.value = null } finally { detailLoading.value = false }
}

async function handleChatMessage(formData) {
  actionError.value = ''
  if (!selectedRequestId.value) return
  detailPanelRef.value?.setChatLoading(true)
  try {
    await requestStore.sendChat(selectedRequestId.value, formData)
    const messages = await requestStore.getChat(selectedRequestId.value)
    detailPanelRef.value?.updateChatMessages(messages)
  } catch (e) {
    actionError.value = e?.response?.data?.message || 'Failed to send chat message'
  } finally { detailPanelRef.value?.setChatLoading(false) }
}

onMounted(loadAll)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="request-management page-block">
      <header class="request-header">
        <div>
          <p class="eyebrow">Creator tools</p>
          <h1>Request Management</h1>
        </div>
        <div class="request-header-actions">
          <router-link to="/dashboard" class="profile-link">Dashboard</router-link>
          <router-link to="/account?tab=requests" class="profile-link">View profile plans</router-link>
        </div>
      </header>

      <div class="management-grid">
        <RequestListSection
          :requests="requests"
          :filtered-requests="filteredRequests"
          :loading="loading"
          :action-error="actionError"
          :active-role="activeRole"
          :status-filter="statusFilter"
          :search-query="searchQuery"
          @select="selectRequest"
          @action="runAction"
          @update:active-role="switchRole"
          @update:status-filter="statusFilter = $event"
          @update:search-query="searchQuery = $event"
          @load-all="loadAll"
        />

        <PlansSection
          v-if="activeRole === 'creator'"
          :terms="terms"
          @create="showCreateForm = true"
        />

        <CreatePlanForm
          v-if="activeRole === 'creator' && showCreateForm"
          @close="showCreateForm = false"
          @saved="loadAll"
        />

        <RequestDetailPanel
          v-if="selectedRequestId"
          ref="detailPanelRef"
          :request="selectedRequestDetail"
          :loading="detailLoading"
          :active-role="activeRole"
          @close="selectRequest(null)"
          @send-chat="handleChatMessage"
          @action="runAction"
          @submit-draft="handleDraftSubmission"
        />
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.request-management {
  min-height: calc(100vh - 112px);
  background: var(--bg);
  padding: 1rem;
}

.request-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto 1rem;
  align-items: center;
}

.request-header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.eyebrow {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

h1 { font-size: 2rem; margin: 0; }

.profile-link {
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-weight: 900;
  padding: 0.72rem 1rem;
  text-decoration: none;
}

.management-grid {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: start;
}
</style>
