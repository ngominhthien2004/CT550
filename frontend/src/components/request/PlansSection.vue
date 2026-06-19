<script setup>
defineProps({
  terms: { type: Array, required: true },
})

const emit = defineEmits(['create'])
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-section {
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

.primary-btn {
  border: none;
  border-radius: 999px;
  background: #0096fa;
  color: #fff;
  font-weight: 900;
  padding: 0.72rem 1rem;
  cursor: pointer;
}

.plan-list { display: grid; gap: 0.5rem; }

.plan-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.9rem;
}

.plan-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.plan-title { font-size: 0.95rem; }

.open {
  background: #d1fae5;
  color: #065f46;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.closed {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.plan-meta { margin: 0; font-size: 0.82rem; color: #64748b; }

.empty { text-align: center; padding: 1.5rem; color: #94a3b8; font-size: 0.88rem; }
</style>
