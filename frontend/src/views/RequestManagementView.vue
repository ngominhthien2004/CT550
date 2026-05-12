<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { useRequestStore } from '../stores/request.store'

const router = useRouter()
const authStore = useAuthStore()
const requestStore = useRequestStore()
const isNavCollapsed = ref(true)
const activeRole = ref('creator')
const statusFilter = ref('')
const saveMessage = ref('')
const actionError = ref('')

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

const workTypes = ['illust', 'manga', 'ugoira', 'novel']
const ageRatings = ['all', 'r-18', 'r-18g']
const requests = computed(() => requestStore.requests)
const terms = computed(() => requestStore.terms)
const loading = computed(() => requestStore.loading)
const error = computed(() => requestStore.error)

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

onMounted(loadAll)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
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
        <form class="term-card" @submit.prevent="saveTerm">
          <div class="section-title">
            <h2>Create Request Plan</h2>
            <span :class="termForm.isOpen ? 'open' : 'closed'">{{ termForm.isOpen ? 'Open' : 'Closed' }}</span>
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
                @click="toggleListValue(termForm.acceptedWorkTypes, type)"
              >
                {{ type }}
              </button>
            </div>

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
            <label>Forbidden topics<input v-model="termForm.forbiddenTopics" type="text" placeholder="R-18G, gore, trademarked logos" /></label>
          </div>

          <label class="inline-check">
            <input v-model="termForm.isOpen" type="checkbox" />
            Open this plan for new Requests
          </label>

          <p v-if="saveMessage" class="state success">{{ saveMessage }}</p>
          <p v-if="error" class="state error">{{ error }}</p>
          <button type="submit" class="primary-btn" :disabled="loading">Save plan</button>
        </form>

        <div class="request-list-card">
          <div class="section-title">
            <h2>Request Queue</h2>
            <div class="filters">
              <select v-model="activeRole" @change="loadAll">
                <option value="creator">Creator</option>
                <option value="requester">Requester</option>
              </select>
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

          <div v-if="terms.length" class="term-summary">
            <span v-for="term in terms" :key="term._id">{{ term.title }} · {{ term.currency }} {{ term.targetPrice }}</span>
          </div>

          <article v-for="item in requests" :key="item._id" class="request-row">
            <div>
              <p class="status-pill">{{ statusLabel(item.status) }}</p>
              <h3>{{ item.title }}</h3>
              <p class="meta">
                {{ item.workType }} · {{ item.currency }} {{ item.proposedAmount }} ·
                {{ activeRole === 'creator' ? item.requester?.displayName || item.requester?.username : item.creator?.displayName || item.creator?.username }}
              </p>
            </div>
            <div v-if="activeRole === 'creator'" class="row-actions">
              <button v-if="item.status === 'pending'" type="button" @click="runAction(item._id, 'accept')">Accept</button>
              <button v-if="item.status === 'pending'" type="button" class="ghost-danger" @click="runAction(item._id, 'reject')">Reject</button>
              <button v-if="item.status === 'accepted'" type="button" @click="runAction(item._id, 'start')">Start</button>
              <button v-if="['accepted', 'in_progress'].includes(item.status)" type="button" class="ghost-danger" @click="runAction(item._id, 'cancel')">Cancel</button>
            </div>
          </article>

          <p v-if="!loading && !requests.length" class="empty">No requests in this view.</p>
        </div>
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
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
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
  align-items: center;
}

.section-title h2 {
  font-size: 1.1rem;
}

.open,
.closed,
.status-pill,
.term-summary span {
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.28rem 0.55rem;
}

.open,
.status-pill {
  background: #ecfeff;
  color: #0f766e;
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
.row-actions,
.term-summary {
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

.term-summary span {
  background: #f8fafc;
  color: #475569;
}

@media (max-width: 960px) {
  .request-header,
  .management-grid {
    grid-template-columns: 1fr;
  }

  .management-grid {
    display: grid;
  }
}

@media (max-width: 680px) {
  .request-header,
  .section-title,
  .request-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
