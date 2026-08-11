<script setup>
import { ref } from 'vue'

defineProps({
  terms: { type: Array, required: true },
})

const emit = defineEmits(['create', 'delete'])

const showConfirmId = ref(null)
const deleting = ref(false)

function confirmDelete(term) {
  showConfirmId.value = term._id
}

function cancelDelete() {
  showConfirmId.value = null
}

async function executeDelete(termId) {
  deleting.value = true
  try {
    emit('delete', termId)
  } finally {
    showConfirmId.value = null
    deleting.value = false
  }
}
</script>

<template>
  <div class="plans-section">
    <div class="section-title">
      <h2>My Plans</h2>
      <button type="button" class="primary-btn" @click="emit('create')">+ Create New Plan</button>
    </div>

    <p v-if="!terms.length" class="empty">No plans yet. Create one to start receiving requests.</p>

    <div v-else class="plan-list">
      <div v-for="term in terms" :key="term._id" class="plan-card">
        <div class="plan-card-header">
          <strong class="plan-title">{{ term.title }}</strong>
          <span :class="term.isOpen ? 'open' : 'closed'">{{ term.isOpen ? 'Open' : 'Closed' }}</span>
        </div>
        <p class="plan-meta">
          {{ term.currency }} {{ term.targetPrice }} · {{ term.estimatedDays }} days · {{ (term.acceptedWorkTypes || []).join(', ') }}
        </p>
        <div class="plan-card-actions">
          <button type="button" class="delete-btn" @click="confirmDelete(term)">Delete</button>
        </div>
        <div v-if="showConfirmId === term._id" class="delete-confirm">
          <p>Are you sure you want to delete this plan? Active requests will be cancelled and requesters will be notified.</p>
          <div class="confirm-actions">
            <button type="button" class="confirm-yes" :disabled="deleting" @click="executeDelete(term._id)">Yes, Delete</button>
            <button type="button" class="confirm-no" @click="cancelDelete">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-section {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
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

.primary-btn {
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.plan-list { display: grid; gap: 0.5rem; }

.plan-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.9rem;
}

.plan-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.plan-title { font-size: 0.95rem; color: var(--text); }

.open {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.closed {
  background: rgba(148, 163, 184, 0.15);
  color: var(--muted);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.plan-meta { margin: 0; font-size: 0.82rem; color: var(--muted); }

.empty { text-align: center; padding: 1.5rem; color: var(--muted); font-size: 0.88rem; }

.plan-card-actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  border: 1px solid #ef4444;
  background: transparent;
  color: #ef4444;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.delete-btn:hover {
  background: #ef4444;
  color: #fff;
}

.delete-confirm {
  margin-top: 0.5rem;
  padding: 0.6rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
}

.delete-confirm p {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  color: var(--text);
}

.confirm-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

.confirm-yes {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.confirm-yes:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-no {
  background: transparent;
  border: 1px solid var(--line);
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--muted);
  cursor: pointer;
}
</style>
