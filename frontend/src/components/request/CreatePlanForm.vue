<script setup>
import { reactive, ref, watch } from 'vue'
import { useRequestStore } from '@/stores/request.store'

const requestStore = useRequestStore()

const emit = defineEmits(['close', 'saved'])

const saveMessage = ref('')
const saveAttempted = ref(false)
const loading = ref(false)

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

function toggleListValue(list, value) {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}

async function saveTerm() {
  saveAttempted.value = true
  saveMessage.value = ''
  loading.value = true
  try {
    await requestStore.createTerm({
      ...termForm,
      preferredStyles: termForm.preferredStyles,
      forbiddenTopics: termForm.forbiddenTopics,
    })
    saveMessage.value = 'Request plan saved.'
    emit('saved')
  } catch (_error) {
    saveMessage.value = ''
  } finally {
    loading.value = false
  }
}

watch(() => ({ ...termForm }), () => { requestStore.error = '' })
</script>

<template>
  <form class="term-card" @submit.prevent="saveTerm">
    <div class="section-title">
      <h2>Create Request Plan</h2>
      <span :class="termForm.isOpen ? 'open' : 'closed'">{{ termForm.isOpen ? 'Open' : 'Closed' }}</span>
      <button type="button" class="ghost-btn" @click="emit('close')">✕</button>
    </div>

    <div class="form-section">
      <div class="form-section-head">
        <h3>Plan basics</h3>
        <p class="section-hint">Give the plan a name fans can recognize.</p>
      </div>
      <div class="form-grid">
        <label>Plan title<input v-model="termForm.title" type="text" required aria-label="Plan title" /></label>
        <label>Tier<input v-model="termForm.tier" type="text" aria-label="Tier" /></label>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-head">
        <h3>Pricing & capacity</h3>
        <p class="section-hint">Set minimum price and how many slots you can take.</p>
      </div>
      <div class="form-grid">
        <label>Target price<input v-model.number="termForm.targetPrice" type="number" min="1" required aria-label="Target price" /></label>
        <label>Currency<input v-model="termForm.currency" type="text" maxlength="8" aria-label="Currency" /></label>
        <label>Estimated days<input v-model.number="termForm.estimatedDays" type="number" min="14" max="60" required aria-label="Estimated days" /></label>
        <label>Max open requests<input v-model.number="termForm.maxOpenRequests" type="number" min="1" max="20" required aria-label="Max open requests" /></label>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-head">
        <h3>Work scope</h3>
        <p class="section-hint">Choose what types of commissions you accept.</p>
      </div>
      <div class="chip-row" aria-label="Accepted work types">
        <button v-for="type in workTypes" :key="type" type="button" :class="{ active: termForm.acceptedWorkTypes.includes(type) }" :title="termForm.acceptedWorkTypes.includes(type) ? 'Click to remove' : 'Click to add'" @click="toggleListValue(termForm.acceptedWorkTypes, type)">
          {{ type }}
        </button>
      </div>
      <p v-if="!termForm.acceptedWorkTypes.length && saveAttempted" class="field-error">Select at least one work type.</p>
      <div class="chip-row" aria-label="Accepted age ratings">
        <button v-for="rating in ageRatings" :key="rating" type="button" :class="{ active: termForm.acceptedAgeRatings.includes(rating) }" @click="toggleListValue(termForm.acceptedAgeRatings, rating)">
          {{ rating }}
        </button>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-head">
        <h3>Guidelines</h3>
        <p class="section-hint">Clarify rules, strengths, and things you avoid.</p>
      </div>
      <label>Rules<textarea v-model="termForm.rules" rows="4" required aria-label="Rules"></textarea></label>
      <label>Strengths<textarea v-model="termForm.strengths" rows="4" required aria-label="Strengths"></textarea></label>
      <label>Preferred styles<input v-model="termForm.preferredStyles" type="text" placeholder="soft color, portrait" aria-label="Preferred styles" /></label>
      <label>Forbidden topics<input v-model="termForm.forbiddenTopics" type="text" placeholder="gore, trademarked logos" aria-label="Forbidden topics" /></label>
    </div>

    <label class="inline-check">
      <input v-model="termForm.isOpen" type="checkbox" aria-label="Open this plan for new Requests" />
      Open this plan for new Requests
    </label>

    <p v-if="saveMessage" class="state success">{{ saveMessage }}</p>
    <p v-if="requestStore.error" class="state error">{{ requestStore.error }}</p>
    <button type="submit" class="primary-btn" :disabled="loading">Save plan</button>
  </form>
</template>

<style scoped>
.term-card {
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

.section-title h2 { font-size: 1.1rem; margin: 0; }

.ghost-btn {
  border: none;
  background: transparent;
  font-size: 1.2rem;
  cursor: pointer;
  color: #64748b;
}

.open { background: #d1fae5; color: #065f46; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.closed { background: #f3f4f6; color: #6b7280; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }

.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fbff;
  padding: 0.9rem;
  display: grid;
  gap: 0.75rem;
}

.form-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.form-section-head h3 { font-size: 1rem; margin: 0; }
.section-hint { margin: 0; color: #64748b; font-size: 0.82rem; font-weight: 700; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-grid label, .form-section > label {
  display: grid;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}

.form-grid input, .form-section > input, .form-section > textarea {
  padding: 0.5rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.88rem;
}

.chip-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.chip-row button {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.chip-row button.active { background: #0096fa; color: #fff; border-color: #0096fa; }

.field-error { color: #dc2626; font-size: 0.82rem; margin: 0; }

.inline-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.primary-btn {
  border: none;
  border-radius: 999px;
  background: #0096fa;
  color: #fff;
  font-weight: 900;
  padding: 0.72rem 1rem;
  cursor: pointer;
}

.state { text-align: center; padding: 0.5rem; font-size: 0.85rem; margin: 0; }
.state.success { color: #059669; }
.state.error { color: #dc2626; }
</style>
