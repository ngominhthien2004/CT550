<script setup>
defineProps({
  requests: { type: Array, required: true },
  filteredRequests: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  activeRole: { type: String, default: 'creator' },
  statusFilter: { type: String, default: '' },
  searchQuery: { type: String, default: '' },
})

const emit = defineEmits(['select', 'action', 'update:statusFilter', 'update:searchQuery', 'loadAll'])

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
      <article v-for="item in filteredRequests" :key="item._id" class="request-row" @click="emit('select', item._id)" @keydown.enter.prevent="emit('select', item._id)" @keydown.space.prevent="emit('select', item._id)" tabindex="0" role="button">
        <div>
          <p :class="['status-pill', 'status-' + item.status]">{{ statusLabel(item.status) }}</p>
          <h3>{{ item.title }}</h3>
          <p class="meta">
            {{ item.workType }} · {{ item.currency }} {{ item.proposedAmount }} ·
            {{ activeRole === 'creator' ? item.requester?.displayName || item.requester?.username : item.creator?.displayName || item.creator?.username }}
          </p>
        </div>
        <div v-if="activeRole === 'creator'" class="row-actions">
          <button v-if="item.status === 'pending'" type="button" @click.stop="emit('action', item._id, 'accept')">Accept</button>
          <button v-if="item.status === 'pending'" type="button" class="ghost-danger" @click.stop="emit('action', item._id, 'reject')">Reject</button>
          <button v-if="item.status === 'accepted'" type="button" @click.stop="emit('action', item._id, 'start')">Start</button>
          <button v-if="['accepted', 'in_progress'].includes(item.status)" type="button" class="ghost-danger" @click.stop="emit('action', item._id, 'cancel')">Cancel</button>
        </div>
      </article>
    </TransitionGroup>

    <p v-if="!loading && !requests.length" class="empty">No requests in this view.</p>
    <p v-else-if="!loading && !filteredRequests.length" class="empty">No requests match "{{ searchQuery }}".</p>
  </div>
</template>

<style scoped>
.request-list-card {
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  background: #fff;
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
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.list-toolbar button.active {
  color: #0096fa;
  border-bottom-color: #0096fa;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.search-input {
  width: 180px;
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  outline: none;
}

.search-input:focus { border-color: #0096fa; background: #fff; }

.filter-bar select {
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  border-radius: 6px;
}

.state { text-align: center; padding: 1rem; color: #64748b; font-size: 0.88rem; }
.state.error { color: #dc2626; }

.request-list-items { display: grid; gap: 0.5rem; }

.request-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.request-row:hover { background: #f8fafc; }

.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
  margin: 0 0 0.4rem;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-accepted { background: #dbeafe; color: #1e40af; }
.status-in_progress { background: #e0e7ff; color: #3730a3; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-rejected { background: #fee2e2; color: #991b1b; }
.status-cancelled { background: #f3f4f6; color: #374151; }

.request-row h3 { margin: 0 0 0.25rem; font-size: 0.95rem; }
.request-row .meta { margin: 0; font-size: 0.82rem; color: #64748b; }

.row-actions { display: flex; gap: 0.4rem; align-items: flex-start; }
.row-actions button {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.row-actions button:hover { background: #f1f5f9; }
.row-actions button.ghost-danger { color: #dc2626; border-color: #fecaca; }
.row-actions button.ghost-danger:hover { background: #fef2f2; }

.empty { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.88rem; }
</style>
