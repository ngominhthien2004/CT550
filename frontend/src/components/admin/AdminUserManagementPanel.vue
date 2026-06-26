<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: {
    type: String,
    required: true,
  },
  userPanelFiltersOpen: {
    type: Boolean,
    required: true,
  },
  userQuery: {
    type: String,
    required: true,
  },
  userRoleFilter: {
    type: String,
    required: true,
  },
  loadingUsers: {
    type: Boolean,
    default: false,
  },
  mutating: {
    type: Boolean,
    default: false,
  },
  users: {
    type: Array,
    required: true,
  },
  userPagination: {
    type: Object,
    required: true,
  },
  formatDate: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'toggle-filters',
  'update:userQuery',
  'update:userRoleFilter',
  'apply-filters',
  'set-user-role',
  'go-page',
])

function onQueryInput(event) {
  emit('update:userQuery', event.target.value)
}

function onRoleFilterChange(event) {
  emit('update:userRoleFilter', event.target.value)
  emit('apply-filters')
}

function onRoleChange(row, event) {
  const newRole = event.target.value
  if (newRole !== row.role) {
    emit('set-user-role', row, newRole)
  }
}

const formattedUsers = computed(() =>
  props.users.map(u => ({ ...u, _createdAt: props.formatDate(u.createdAt) }))
)
</script>

<template>
  <section v-show="activeTab === 'users'" id="admin-user-panel" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>User Management</h2>
      <button
        class="btn btn-sm btn-outline-secondary"
        type="button"
        :aria-expanded="userPanelFiltersOpen"
        aria-controls="admin-user-filters"
        @click="emit('toggle-filters')"
      >
        {{ userPanelFiltersOpen ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="userPanelFiltersOpen" id="admin-user-filters" class="filters" role="region" aria-label="User filters">
      <input
        :value="userQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Search by username/email"
        aria-label="Search users by username or email"
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <select :value="userRoleFilter" class="form-select form-select-sm" @change="onRoleFilterChange" aria-label="Filter users by role">
        <option value="all">All roles</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loadingUsers" @click="emit('apply-filters')">Apply</button>
    </div>

    <p v-if="loadingUsers" class="state-note">Loading users...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedUsers" :key="row._id">
            <td>{{ row.displayName || row.username }}</td>
            <td>{{ row.email }}</td>
            <td>
              <select
                :value="row.role"
                class="form-select form-select-sm role-select"
                :class="row.role === 'admin' ? 'role-admin' : 'role-user'"
                :disabled="mutating"
                @change="onRoleChange(row, $event)"
                :aria-label="`Change role for ${row.username}`"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td>{{ row._createdAt }}</td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="4" class="text-center text-muted py-3">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="User pagination">
      <span>Page {{ userPagination.page }} / {{ userPagination.pages }} • {{ userPagination.total }} users</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="userPagination.page <= 1 || loadingUsers" @click="emit('go-page', userPagination.page - 1)">
          Previous
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="userPagination.page >= userPagination.pages || loadingUsers" @click="emit('go-page', userPagination.page + 1)">
          Next
        </button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.role-select {
  min-width: 90px;
  font-weight: 600;
  font-size: 0.78rem;
  cursor: pointer;
  border-radius: 999px;
  padding: 0.2rem 0.5rem;
  text-align: center;
  appearance: auto;
}

.role-admin {
  background: rgba(220, 38, 38, 0.1);
  color: var(--danger);
  border-color: rgba(220, 38, 38, 0.25);
}

.role-user {
  background: var(--surface-alt);
  color: var(--muted);
  border-color: var(--line);
}

:root.dark-theme .role-admin {
  background: rgba(252, 165, 165, 0.12);
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.2);
}

:root.dark-theme .role-user {
  background: var(--surface-alt);
  color: var(--muted);
  border-color: var(--line);
}
</style>
