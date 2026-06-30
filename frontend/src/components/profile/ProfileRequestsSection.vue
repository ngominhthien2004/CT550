<script setup>
import { computed, reactive, ref, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useRequestStore } from '../../stores/request.store'

const props = defineProps({
  terms: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const authStore = useAuthStore()
const requestStore = useRequestStore()
const user = inject('profileUser')
const isOwnProfile = inject('isOwnProfile')
const selectedTermId = ref('')
const referenceFiles = ref([])
const submitMessage = ref('')
const submitError = ref('')
const submitting = ref(false)

const form = reactive({
  title: '',
  description: '',
  workType: 'illust',
  tags: '',
  pose: '',
  outfit: '',
  mood: '',
  lighting: '',
  angle: '',
  proposedAmount: '',
  visibility: 'private',
  isAnonymous: false,
  ageRating: 'all',
})

const openTerms = computed(() => props.terms.filter((term) => term.isOpen))
const visibleTerms = computed(() => (isOwnProfile.value ? props.terms : openTerms.value))
const selectedTerm = computed(() => openTerms.value.find((term) => term._id === selectedTermId.value) || openTerms.value[0] || null)
const canSubmit = computed(() => Boolean(selectedTerm.value && authStore.isAuthenticated && !isOwnProfile.value))

function syncTermDefaults(term) {
  if (!term) return
  selectedTermId.value = term._id
  form.workType = term.acceptedWorkTypes?.[0] || 'illust'
  form.proposedAmount = term.targetPrice || ''
}

function handleFileChange(event) {
  referenceFiles.value = Array.from(event.target.files || []).slice(0, 15)
}

async function submitRequest() {
  submitMessage.value = ''
  submitError.value = ''

  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: `/account?user=${user.value._id}&tab=requests` } })
    return
  }

  if (!selectedTerm.value) {
    submitError.value = 'Creator is not accepting requests right now.'
    return
  }

  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('termId', selectedTerm.value._id)
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('workType', form.workType)
    fd.append('tags', form.tags)
    fd.append('pose', form.pose)
    fd.append('outfit', form.outfit)
    fd.append('mood', form.mood)
    fd.append('lighting', form.lighting)
    fd.append('angle', form.angle)
    fd.append('proposedAmount', form.proposedAmount)
    fd.append('visibility', form.visibility)
    fd.append('isAnonymous', String(form.isAnonymous))
    fd.append('ageRating', form.ageRating)
    referenceFiles.value.forEach((file) => fd.append('referenceImages', file))

    await requestStore.submitRequest(fd)
    submitMessage.value = 'Request submitted. Your payment is marked as held in escrow while the creator reviews it.'
    form.title = ''
    form.description = ''
    form.tags = ''
    form.pose = ''
    form.outfit = ''
    form.mood = ''
    form.lighting = ''
    form.angle = ''
    referenceFiles.value = []
  } catch (error) {
    submitError.value = error?.response?.data?.message || 'Failed to submit request'
  } finally {
    submitting.value = false
  }
}

watch(
  openTerms,
  (terms) => {
    if (!selectedTermId.value && terms.length) {
      syncTermDefaults(terms[0])
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="profile-requests">
    <div class="request-section-head">
      <div>
        <p class="eyebrow">Request</p>
        <h2>Commission plans</h2>
      </div>
      <router-link v-if="isOwnProfile" to="/requests/manage" class="manage-link">Manage requests</router-link>
    </div>

    <p v-if="loading" class="state-text">Loading request plans...</p>
    <p v-else-if="error" class="state-text error">{{ error }}</p>

    <div v-if="visibleTerms.length" class="request-plan-grid">
      <article
        v-for="term in visibleTerms"
        :key="term._id"
        class="request-plan"
        :class="{ selected: selectedTerm?._id === term._id }"
        @click="syncTermDefaults(term)"
        @keydown.enter.prevent="syncTermDefaults(term)"
        @keydown.space.prevent="syncTermDefaults(term)"
        tabindex="0"
        role="button"
      >
        <div class="plan-topline">
          <h3>{{ term.title }}</h3>
          <span>{{ term.currency || 'USD' }} {{ term.targetPrice }}</span>
        </div>
        <div class="plan-badges">
          <span class="plan-status" :class="term.isOpen ? 'status-open' : 'status-closed'">
            {{ term.isOpen ? 'Open' : 'Closed' }}
          </span>
          <span v-if="term.isOpen" class="plan-status status-accepting">Accepting requests</span>
        </div>
        <p>{{ term.strengths }}</p>
        <div class="plan-tags">
          <span v-for="type in term.acceptedWorkTypes" :key="type">{{ type }}</span>
          <span>{{ term.estimatedDays }} days</span>
          <span>{{ term.maxOpenRequests }} open slots</span>
        </div>
        <p class="rules">{{ term.rules }}</p>
      </article>
    </div>

    <div v-else-if="!loading" class="empty-panel">
      <p class="empty-text">
        {{ isOwnProfile ? 'Create at least one plan to start accepting Requests.' : 'This creator is not accepting Requests right now.' }}
      </p>
      <router-link v-if="isOwnProfile" to="/requests/manage" class="manage-link outline">Create a plan</router-link>
    </div>

    <form v-if="!isOwnProfile && openTerms.length" class="request-form" @submit.prevent="submitRequest">
      <div class="form-title-row">
        <div>
          <p class="eyebrow">Send Request</p>
          <h3>{{ selectedTerm?.title || 'Select a plan' }}</h3>
        </div>
        <select v-model="selectedTermId" @change="syncTermDefaults(selectedTerm)" aria-label="Select commission plan">
          <option v-for="term in openTerms" :key="term._id" :value="term._id">{{ term.title }}</option>
        </select>
      </div>

      <div class="form-grid">
        <label>
          Title
          <input v-model="form.title" type="text" maxlength="160" required placeholder="Character birthday illustration" aria-label="Request title" />
        </label>
        <label>
          Proposed amount
          <input v-model.number="form.proposedAmount" type="number" min="1" required aria-label="Proposed amount" />
        </label>
        <label>
          Work type
          <select v-model="form.workType" aria-label="Work type">
            <option v-for="type in selectedTerm?.acceptedWorkTypes || []" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label>
          Visibility
          <select v-model="form.visibility" aria-label="Visibility">
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>

      <label>
        Description
        <textarea v-model="form.description" rows="5" required placeholder="Markdown is OK. Include intent, references, deadline concerns, and usage notes." aria-label="Request description"></textarea>
      </label>

      <div class="form-grid specifics-grid">
        <label><span>Pose</span><input v-model="form.pose" type="text" aria-label="Pose" /></label>
        <label><span>Outfit</span><input v-model="form.outfit" type="text" aria-label="Outfit" /></label>
        <label><span>Mood</span><input v-model="form.mood" type="text" aria-label="Mood" /></label>
        <label><span>Lighting</span><input v-model="form.lighting" type="text" aria-label="Lighting" /></label>
        <label><span>Angle</span><input v-model="form.angle" type="text" aria-label="Angle" /></label>
        <label><span>Tags</span><input v-model="form.tags" type="text" placeholder="oc, portrait" aria-label="Tags" /></label>
      </div>

      <div class="form-grid">
        <label>
          Age rating
          <select v-model="form.ageRating" aria-label="Age rating">
            <option value="all">All ages</option>
            <option value="r-18">R-18</option>
          </select>
        </label>
        <label class="file-field">
          Reference images
          <input type="file" accept="image/*,.pdf" multiple @change="handleFileChange" aria-label="Reference images" />
        </label>
      </div>

      <label class="inline-check">
        <input v-model="form.isAnonymous" type="checkbox" aria-label="Send anonymously" />
        Send anonymously on public surfaces
      </label>

      <p v-if="submitMessage" class="state-text success">{{ submitMessage }}</p>
      <p v-if="submitError" class="state-text error">{{ submitError }}</p>

      <button type="submit" class="submit-request-btn" :disabled="submitting || !canSubmit">
        {{ submitting ? 'Submitting...' : 'Submit Request' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.profile-requests {
  display: grid;
  gap: 1rem;
  padding-top: 1rem;
}

.request-section-head,
.form-title-row,
.plan-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.request-section-head h2,
.form-title-row h3 {
  color: var(--brand);
  font-size: 1.35rem;
}

.manage-link,
.submit-request-btn {
  border: none;
  border-radius: 999px;
  background: var(--accent, #0096fa);
  color: var(--surface);
  font-weight: 800;
  padding: 0.7rem 1rem;
  text-decoration: none;
}

.request-plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.85rem;
}

.request-plan,
.request-form,
.empty-panel {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  padding: 1rem;
}

.request-plan {
  cursor: pointer;
  display: grid;
  gap: 0.65rem;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.plan-status {
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-open {
  background: #dcfce7;
  color: #15803d;
}

.status-closed {
  background: #fee2e2;
  color: #b91c1c;
}

.status-accepting {
  background: #e0f2fe;
  color: #0369a1;
}

.request-plan.selected {
  border-color: var(--accent, #0096fa);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, #0096fa) 12%, transparent);
}

.request-plan h3 {
  font-size: 1rem;
}

.request-plan p {
  color: var(--text);
  font-size: 0.86rem;
  line-height: 1.55;
}

.plan-topline span {
  color: #0f766e;
  font-weight: 900;
  white-space: nowrap;
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.plan-tags span {
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.26rem 0.55rem;
}

.rules {
  border-top: 1px solid var(--line);
  padding-top: 0.55rem;
}

.request-form {
  display: grid;
  gap: 0.85rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

label {
  display: grid;
  gap: 0.35rem;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-weight: 600;
  padding: 0.68rem 0.72rem;
}

textarea {
  resize: vertical;
  line-height: 1.5;
}

.inline-check {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
}

.inline-check input {
  width: auto;
}

.state-text {
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 700;
}

.state-text.error {
  color: var(--danger, #dc2626);
}

.state-text.success {
  color: #15803d;
}

.empty-text {
  margin: 0;
}

.manage-link.outline {
  background: var(--surface);
  color: var(--accent, #0096fa);
  border: 1px solid var(--accent, #0096fa);
  text-align: center;
}

.submit-request-btn:disabled {
  opacity: 0.55;
}
</style>
