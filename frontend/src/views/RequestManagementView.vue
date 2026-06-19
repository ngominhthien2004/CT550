<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '../stores/auth.store'
import { useRequestStore } from '../stores/request.store'
import RequestDetailPanel from '../components/request/RequestDetailPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const requestStore = useRequestStore()
const isNavCollapsed = ref(true)
const activeRole = ref('creator')
const statusFilter = ref('')
const saveMessage = ref('')
const actionError = ref('')
const selectedRequestId = ref(null)
const selectedRequestDetail = ref(null)
const detailLoading = ref(false)
const detailPanelRef = ref(null)
const saveAttempted = ref(false)
const showCreateForm = ref(false)
const searchQuery = ref('')

const termForm = reactive({
  title: 'Basic Request',
  tier: 'Basic',
  targetPrice: 50,
  currency: 'USD',
  acceptedWorkTypes: ['illust'],
  acceptedAgeRatings: ['all'],
  estimatedDays: 21,
  maxOpenRequests: 3,
  preferredStyles: '',
  forbiddenTopics: '',
  rules: 'Minor revisions only. No copyright-infringing characters without clear usage permission.',
  strengths: 'Character illustration, soft lighting, expressive portraits.',
  isOpen: true,
})

const workTypes = ['illust', 'manga', 'gif', 'novel']
const ageRatings = ['all', 'r-18']
const requests = computed(() => requestStore.requests)
const terms = computed(() => requestStore.terms)
const loading = computed(() => requestStore.loading)
const error = computed(() => requestStore.error)

const filteredRequests = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return requests.value
  return requests.value.filter(item =>
    (item.title || '').toLowerCase().includes(query)
  )
})

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function toggleListValue(list, value) {
  const index = list.indexOf(value)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.push(value)
  }
}

function statusLabel(value) {
  return String(value || '').replace(/_/g, ' ')
}

function switchRole(role) {
  activeRole.value = role
  loadAll()
}

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

async function saveTerm() {
  saveAttempted.value = true
  saveMessage.value = ''
  try {
    await requestStore.createTerm({
      ...termForm,
      preferredStyles: termForm.preferredStyles,
      forbiddenTopics: termForm.forbiddenTopics,
    })
    saveMessage.value = 'Request plan saved.'
  } catch (_error) {
    saveMessage.value = ''
  }
}

async function runAction(requestId, action) {
  actionError.value = ''
  try {
    await requestStore.transition(requestId, action)
  } catch (error) {
    actionError.value = error?.response?.data?.message || `Failed to ${action} request`
  }
}

async function selectRequest(requestId) {
  if (!requestId) {
    selectedRequestId.value = null
    selectedRequestDetail.value = null
    return
  }
  selectedRequestId.value = requestId
  detailLoading.value = true
  try {
    const detail = await requestStore.fetchById(requestId)
    selectedRequestDetail.value = detail
  } catch (_e) {
    selectedRequestDetail.value = null
  } finally {
    detailLoading.value = false
  }
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
  } finally {
    detailPanelRef.value?.setChatLoading(false)
  }
}

onMounted(loadAll)

watch(
  () => ({ ...termForm }),
  () => {
    requestStore.error = ''
  },
  { deep: true }
)
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
        <!-- 1. REQUEST QUEUE — always visible -->
        <div class="request-list-card">
          <div class="list-toolbar" role="tablist" aria-label="Role tabs">
            <button
              role="tab"
              :aria-selected="activeRole === 'creator'"
              :class="{ active: activeRole === 'creator' }"
              @click="switchRole('creator')"
            >Creator</button>
            <button
              role="tab"
              :aria-selected="activeRole === 'requester'"
              :class="{ active: activeRole === 'requester' }"
              @click="switchRole('requester')"
            >Requester</button>
            <div class="filter-bar">
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search requests..."
                class="search-input"
              />
              <select v-model="statusFilter" @change="loadAll">
                <option value="">All status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In progress</option>
                <option value="draft_submitted">Draft submitted</option>
                <option value="revision">Revision</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <p v-if="actionError" class="state error">{{ actionError }}</p>
          <p v-if="loading" class="state">Loading requests...</p>

          <TransitionGroup name="request-list" tag="div" class="request-list-items">
            <article v-for="item in filteredRequests" :key="item._id" class="request-row" @click="selectRequest(item._id)">
              <div>
                <p :class="['status-pill', 'status-' + item.status]">{{ statusLabel(item.status) }}</p>
                <h3>{{ item.title }}</h3>
                <p class="meta">
                  {{ item.workType }} · {{ item.currency }} {{ item.proposedAmount }} ·
                  {{ activeRole === 'creator' ? item.requester?.displayName || item.requester?.username : item.creator?.displayName || item.creator?.username }}
                </p>
              </div>
              <div v-if="activeRole === 'creator'" class="row-actions">
                <button v-if="item.status === 'pending'" type="button" @click.stop="runAction(item._id, 'accept')">Accept</button>
                <button v-if="item.status === 'pending'" type="button" class="ghost-danger" @click.stop="runAction(item._id, 'reject')">Reject</button>
                <button v-if="item.status === 'accepted'" type="button" @click.stop="runAction(item._id, 'start')">Start</button>
                <button v-if="['accepted', 'in_progress'].includes(item.status)" type="button" class="ghost-danger" @click.stop="runAction(item._id, 'cancel')">Cancel</button>
              </div>
            </article>
          </TransitionGroup>

          <p v-if="!loading && !requests.length" class="empty">No requests in this view.</p>
          <p v-else-if="!loading && !filteredRequests.length" class="empty">No requests match "{{ searchQuery }}".</p>
        </div>

        <!-- 2. MY PLANS — only visible for Creator -->
        <div v-if="activeRole === 'creator'" class="plans-section">
          <div class="section-title">
            <h2>My Plans</h2>
            <button v-if="!showCreateForm" type="button" class="primary-btn" @click="showCreateForm = true">+ Create New Plan</button>
          </div>

          <div v-if="!terms.length && !showCreateForm" class="empty">No plans yet. Create one to start receiving requests.</div>

          <div v-if="terms.length" class="plan-list">
            <div v-for="term in terms" :key="term._id" class="plan-card">
              <div class="plan-card-header">
                <strong class="plan-title">{{ term.title }}</strong>
                <span :class="term.isOpen ? 'open' : 'closed'">{{ term.isOpen ? 'Open' : 'Closed' }}</span>
              </div>
              <p class="plan-meta">
                {{ term.currency }} {{ term.targetPrice }} · {{ term.estimatedDays }} days · {{ (term.acceptedWorkTypes || []).join(', ') }}
              </p>
            </div>
          </div>
        </div>

        <!-- 3. CREATE PLAN FORM — toggled by + Create New Plan button, only for Creator -->
        <form v-if="activeRole === 'creator' && showCreateForm" class="term-card" @submit.prevent="saveTerm">
          <div class="section-title">
            <h2>Create Request Plan</h2>
            <span :class="termForm.isOpen ? 'open' : 'closed'">{{ termForm.isOpen ? 'Open' : 'Closed' }}</span>
            <button type="button" class="ghost-btn" @click="showCreateForm = false">✕</button>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <h3>Plan basics</h3>
              <p class="section-hint">Give the plan a name fans can recognize.</p>
            </div>
            <div class="form-grid">
              <label>Plan title<input v-model="termForm.title" type="text" required /></label>
              <label>Tier<input v-model="termForm.tier" type="text" /></label>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <h3>Pricing & capacity</h3>
              <p class="section-hint">Set minimum price and how many slots you can take.</p>
            </div>
            <div class="form-grid">
              <label>Target price<input v-model.number="termForm.targetPrice" type="number" min="1" required /></label>
              <label>Currency<input v-model="termForm.currency" type="text" maxlength="8" /></label>
              <label>Estimated days<input v-model.number="termForm.estimatedDays" type="number" min="14" max="60" required /></label>
              <label>Max open requests<input v-model.number="termForm.maxOpenRequests" type="number" min="1" max="20" required /></label>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <h3>Work scope</h3>
              <p class="section-hint">Choose what types of commissions you accept.</p>
            </div>
            <div class="chip-row" aria-label="Accepted work types">
              <button
                v-for="type in workTypes"
                :key="type"
                type="button"
                :class="{ active: termForm.acceptedWorkTypes.includes(type) }"
                :title="termForm.acceptedWorkTypes.includes(type) ? 'Click to remove' : 'Click to add'"
                @click="toggleListValue(termForm.acceptedWorkTypes, type)"
              >
                {{ type }}
              </button>
            </div>
            <p v-if="!termForm.acceptedWorkTypes.length && saveAttempted" class="field-error">Select at least one work type.</p>

            <div class="chip-row" aria-label="Accepted age ratings">
              <button
                v-for="rating in ageRatings"
                :key="rating"
                type="button"
                :class="{ active: termForm.acceptedAgeRatings.includes(rating) }"
                @click="toggleListValue(termForm.acceptedAgeRatings, rating)"
              >
                {{ rating }}
              </button>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <h3>Guidelines</h3>
              <p class="section-hint">Clarify rules, strengths, and things you avoid.</p>
            </div>
            <label>Rules<textarea v-model="termForm.rules" rows="4" required></textarea></label>
            <label>Strengths<textarea v-model="termForm.strengths" rows="4" required></textarea></label>
            <label>Preferred styles<input v-model="termForm.preferredStyles" type="text" placeholder="soft color, portrait" /></label>
            <label>Forbidden topics<input v-model="termForm.forbiddenTopics" type="text" placeholder="gore, trademarked logos" /></label>
          </div>

          <label class="inline-check">
            <input v-model="termForm.isOpen" type="checkbox" />
            Open this plan for new Requests
          </label>

          <p v-if="saveMessage" class="state success">{{ saveMessage }}</p>
          <p v-if="error" class="state error">{{ error }}</p>
          <button type="submit" class="primary-btn" :disabled="loading">Save plan</button>
        </form>

        <RequestDetailPanel
          v-if="selectedRequestId"
          ref="detailPanelRef"
          :request="selectedRequestDetail"
          :loading="detailLoading"
          :active-role="activeRole"
          @close="selectRequest(null)"
          @send-chat="handleChatMessage"
        />
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.request-management {
  min-height: calc(100vh - 112px);
  background: #f6f9fd;
  padding: 1rem;
}

.request-header,
.section-title,
.request-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.request-header {
  max-width: 1180px;
  margin: 0 auto 1rem;
  align-items: center;
}

.request-header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fbff;
  padding: 0.9rem;
  display: grid;
  gap: 0.75rem;
}

.form-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.form-section-head h3 {
  font-size: 1rem;
  margin: 0;
}

.section-hint {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.eyebrow {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  font-size: 2rem;
}

.profile-link,
.primary-btn {
  border: none;
  border-radius: 999px;
  background: #0096fa;
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

.term-card,
.request-list-card {
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title h2 {
  font-size: 1.1rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  width: 180px;
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.search-input:focus {
  border-color: var(--accent);
  background: #fff;
}

.search-input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

/* Make the status select compact when inside filter-bar */
.filter-bar select {
  width: auto;
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  border-radius: 6px;
}

.open,
.closed {
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.28rem 0.55rem;
}

/* Status pill base */
.status-pill {
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.28rem 0.55rem;
}

/* Keep .open separate */
.open {
  background: #ecfeff;
  color: #0f766e;
}

/* Status-specific colors */
.status-pending {
  background: #fef3c7;
  color: #b45309;
}
.status-accepted {
  background: #e0f2fe;
  color: #0369a1;
}
.status-in_progress {
  background: #ecfeff;
  color: #0f766e;
}
.status-draft_submitted {
  background: #f3e8ff;
  color: #7c3aed;
}
.status-revision {
  background: #fff7ed;
  color: #c2410c;
}
.status-completed {
  background: #f0fdf4;
  color: #15803d;
}
.status-rejected {
  background: #fef2f2;
  color: #b91c1c;
}
.status-cancelled {
  background: #fef2f2;
  color: #991b1b;
}

.closed {
  background: #f1f5f9;
  color: #64748b;
}

label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #d8e1ef;
  border-radius: 8px;
  color: #172033;
  font: inherit;
  font-weight: 600;
  padding: 0.66rem 0.7rem;
}

textarea {
  resize: vertical;
  line-height: 1.45;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.chip-row,
.filters,
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip-row button,
.row-actions button {
  border: 1px solid #d8e1ef;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-weight: 900;
  padding: 0.48rem 0.75rem;
}

.chip-row button.active,
.row-actions button {
  border-color: #0096fa;
  background: #eff6ff;
  color: #0369a1;
}

.row-actions .ghost-danger {
  border-color: #fecaca;
  background: #fff7f7;
  color: #b91c1c;
}

.inline-check {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.inline-check input {
  width: auto;
}

.state,
.empty {
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 700;
}

.state.error {
  color: #dc2626;
}

.state.success {
  color: #15803d;
}

.request-row {
  border-top: 1px solid #edf0f4;
  padding-top: 0.85rem;
  align-items: center;
}

.request-row h3 {
  margin-top: 0.3rem;
  font-size: 1rem;
}

.meta {
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.82rem;
}

/* Plan cards */
.plans-section {
  background: #fff;
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}

.plan-list {
  display: grid;
  gap: 0.5rem;
}

.plan-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  background: #f8fbff;
}

.plan-card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.plan-title {
  font-size: 0.95rem;
  color: #1e293b;
}

.plan-meta {
  margin-top: 0.3rem;
  font-size: 0.82rem;
  color: #64748b;
}

.ghost-btn {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  line-height: 1;
}

.ghost-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

@media (max-width: 960px) {
  .request-header {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 680px) {
  .request-header,
  .request-row,
  .list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: auto;
  }

  .filter-bar {
    margin-left: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

.field-error {
  color: #dc2626;
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0;
}

.request-list-items {
  display: grid;
  gap: 0.5rem;
}

.request-list-enter-active,
.request-list-leave-active {
  transition: all 0.3s ease;
}

.request-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.request-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.request-list-move {
  transition: transform 0.3s ease;
}

.list-toolbar {
  display: flex;
  align-items: center;
  gap: 1.35rem;
  border-bottom: 1px solid var(--line);
  width: 100%;
}

.list-toolbar button {
  text-decoration: none;
  color: var(--muted);
  font-weight: 700;
  padding: 0.78rem 0.1rem 0.9rem;
  font-size: 0.9rem;
  white-space: nowrap;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s, border-color 0.2s;
}

.list-toolbar button:hover {
  color: var(--brand);
}

.list-toolbar button.active {
  color: var(--brand);
  border-bottom-color: var(--accent);
}

.filter-bar {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
