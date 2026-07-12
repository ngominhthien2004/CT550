<script setup>
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'

defineProps({
  requests: { type: Array, required: true },
  filteredRequests: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  activeRole: { type: String, default: 'creator' },
  statusFilter: { type: String, default: '' },
  searchQuery: { type: String, default: '' },
  dateRange: { type: Object, default: () => ({ from: '', to: '' }) },
})

const emit = defineEmits(['select', 'action', 'update:statusFilter', 'update:searchQuery', 'update:dateRange', 'loadAll'])

function statusLabel(value) {
  return String(value || '').replace(/_/g, ' ')
}
</script>

<template>
  <div class="request-list-card">
    <div class="list-toolbar" role="tablist" aria-label="Role tabs">
      <button type="button" role="tab" :aria-selected="activeRole === 'creator'" :class="{ active: activeRole === 'creator' }" @click="$emit('update:activeRole', 'creator')">Creator</button>
      <button type="button" role="tab" :aria-selected="activeRole === 'requester'" :class="{ active: activeRole === 'requester' }" @click="$emit('update:activeRole', 'requester')">Requester</button>
      <div class="filter-bar">
        <input :value="searchQuery" type="search" placeholder="Search requests..." class="search-input" aria-label="Search requests" @input="emit('update:searchQuery', $event.target.value)" />
        <select :value="statusFilter" @change="emit('update:statusFilter', $event.target.value); emit('loadAll')" aria-label="Filter by status">
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="draft_submitted">Draft submitted</option>
          <option value="revision">Revision</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
    <div class="date-filter-row">
      <DateRangeFilter
        :model-value="dateRange"
        compact
        @update:model-value="emit('update:dateRange', $event)"
      />
    </div>

    <p v-if="actionError" class="state error">{{ actionError }}</p>
    <p v-if="loading" class="state">Loading requests...</p>

    <TransitionGroup name="request-list" tag="div" class="request-list-items">
      <article v-for="item in filteredRequests" :key="item._id" class="request-row" @click="emit('select', item._id)" @keydown.enter.prevent="emit('select', item._id)" @keydown.space.prevent="emit('select', item._id)" tabindex="0" role="button">
        <div>
          <p :class="['status-pill', 'status-' + item.status]">{{ statusLabel(item.status) }}</p>
          <h3>{{ item.title }}</h3>
          <p class="meta">
            <span v-if="item.term" class="plan-tag">{{ item.term.title || item.term.tier }}</span>
            {{ item.workType }} · {{ item.currency }} {{ item.proposedAmount }} ·
            {{ activeRole === 'creator' ? item.requester?.displayName || item.requester?.username : item.creator?.displayName || item.creator?.username }}
          </p>
        </div>
        <div v-if="activeRole === 'creator'" class="row-actions">
          <button v-if="item.status === 'pending'" type="button" @click.stop="emit('action', item._id, 'accept')">Accept</button>
          <button v-if="item.status === 'pending'" type="button" class="ghost-danger" @click.stop="emit('action', item._id, 'reject')">Reject</button>
          <button v-if="item.status === 'in_progress'" type="button" class="ghost-danger" @click.stop="emit('action', item._id, 'cancel')">Cancel</button>
        </div>
      </article>
    </TransitionGroup>

    <p v-if="!loading && !requests.length" class="empty">No requests in this view.</p>
    <p v-else-if="!loading && !filteredRequests.length" class="empty">No requests match "{{ searchQuery }}".</p>
  </div>
</template>

<style scoped>
.request-list-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.list-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.list-toolbar button {
  padding: 0.5rem 1rem;
  font-size: 0.88rem;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.list-toolbar button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.date-filter-row {
  display: flex;
  align-items: center;
  padding-top: 0.3rem;
}

.search-input {
  width: 180px;
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-alt);
  color: var(--text);
  outline: none;
}

.search-input:focus { border-color: var(--accent); background: var(--surface); }

.filter-bar select {
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  border-radius: 6px;
}

.state { text-align: center; padding: 1rem; color: var(--muted); font-size: 0.88rem; }
.state.error { color: var(--danger); }

.request-list-items { display: grid; gap: 0.5rem; }

.request-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.request-row:hover { background: var(--surface-alt); }

.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
  margin: 0 0 0.4rem;
}

.status-pending { background: rgba(234, 179, 8, 0.15); color: #f59e0b; }
.status-accepted { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.status-in_progress { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
.status-completed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.status-rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.status-cancelled { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

.request-row h3 { margin: 0 0 0.25rem; font-size: 0.95rem; color: var(--text); }
.request-row .meta { margin: 0; font-size: 0.82rem; color: var(--muted); }

.row-actions { display: flex; gap: 0.4rem; align-items: flex-start; }
.row-actions button {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.row-actions button:hover { background: var(--surface-alt); }
.row-actions button.ghost-danger { color: var(--danger); border-color: rgba(239, 68, 68, 0.3); }
.row-actions button.ghost-danger:hover { background: rgba(239, 68, 68, 0.1); }

.plan-tag {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  font-size: 0.72rem;
  font-weight: 700;
  margin-right: 0.25rem;
}

.empty { text-align: center; padding: 2rem; color: var(--muted); font-size: 0.88rem; }
</style>
