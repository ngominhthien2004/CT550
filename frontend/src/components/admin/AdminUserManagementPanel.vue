<script setup>
defineProps({
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
  'toggle-premium',
  'go-page',
])

function onQueryInput(event) {
  emit('update:userQuery', event.target.value)
}

function onRoleFilterChange(event) {
  emit('update:userRoleFilter', event.target.value)
  emit('apply-filters')
}
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
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <select :value="userRoleFilter" class="form-select form-select-sm" @change="onRoleFilterChange">
        <option value="all">All roles</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button class="btn btn-sm btn-outline-primary" :disabled="loadingUsers" @click="emit('apply-filters')">Apply</button>
    </div>

    <p v-if="loadingUsers" class="state-note">Loading users...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Premium</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in users" :key="row._id">
            <td>{{ row.displayName || row.username }}</td>
            <td>{{ row.email }}</td>
            <td>
              <span class="badge" :class="row.role === 'admin' ? 'bg-danger-subtle text-danger-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">
                {{ row.role }}
              </span>
            </td>
            <td>
              <span class="badge" :class="row.isPremium ? 'bg-warning-subtle text-warning-emphasis' : 'bg-light text-dark'">
                {{ row.isPremium ? 'Premium' : 'Standard' }}
              </span>
            </td>
            <td>{{ formatDate(row.createdAt) }}</td>
            <td class="actions-cell">
              <button
                class="btn btn-sm btn-outline-danger"
                :disabled="mutating || row.role === 'admin'"
                @click="emit('set-user-role', row, 'admin')"
              >
                Make admin
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                :disabled="mutating || row.role === 'user'"
                @click="emit('set-user-role', row, 'user')"
              >
                Make user
              </button>
              <button class="btn btn-sm btn-outline-warning" :disabled="mutating" @click="emit('toggle-premium', row)">
                {{ row.isPremium ? 'Remove premium' : 'Grant premium' }}
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="6" class="text-center text-muted py-3">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="User pagination">
      <span>Page {{ userPagination.page }} / {{ userPagination.pages }} • {{ userPagination.total }} users</span>
      <div class="pager-actions">
        <button class="btn btn-sm btn-outline-secondary" :disabled="userPagination.page <= 1 || loadingUsers" @click="emit('go-page', userPagination.page - 1)">
          Previous
        </button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="userPagination.page >= userPagination.pages || loadingUsers" @click="emit('go-page', userPagination.page + 1)">
          Next
        </button>
      </div>
    </footer>
  </section>
</template>
