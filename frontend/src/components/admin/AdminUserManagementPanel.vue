<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AdminPagination from './AdminPagination.vue'
import AdminPillSelect from './AdminPillSelect.vue'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'

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
  userDateRange: {
    type: Object,
    default: () => ({ from: '', to: '' }),
  },
})

const emit = defineEmits([
  'toggle-filters',
  'update:userQuery',
  'update:userRoleFilter',
  'update:userDateRange',
  'apply-filters',
  'set-user-role',
  'delete-user',
  'go-page',
])

const openDropdownId = ref(null)

function toggleDropdown(id) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

function selectRole(row, role) {
  if (role !== row.role) {
    emit('set-user-role', row, role)
  }
  openDropdownId.value = null
}

function onClickOutside(e) {
  if (!e.target.closest('.role-dropdown')) {
    openDropdownId.value = null
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function onQueryInput(event) {
  emit('update:userQuery', event.target.value)
}

function onRoleFilterChange(value) {
  emit('update:userRoleFilter', value)
  emit('apply-filters')
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
      <div class="filter-row-main">
        <input
          :value="userQuery"
          type="text"
          class="form-control form-control-sm"
          placeholder="Search by username/email"
          aria-label="Search users by username or email"
          @input="onQueryInput"
          @keyup.enter="emit('apply-filters')"
        />
        <AdminPillSelect
          :model-value="userRoleFilter"
          :options="[
            { value: 'all', label: 'All roles' },
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]"
          label="Filter users by role"
          @update:model-value="onRoleFilterChange"
        />
        <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loadingUsers" @click="emit('apply-filters')">Apply</button>
      </div>
      <div class="filter-row-dates">
        <DateRangeFilter
          :model-value="userDateRange"
          compact
          @update:model-value="emit('update:userDateRange', $event)"
        />
      </div>
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedUsers" :key="row._id">
            <td>
              <router-link :to="`/account?user=${row._id}`" class="user-link">{{ row.displayName || row.username }}</router-link>
            </td>
            <td>{{ row.email }}</td>
            <td>
              <div class="role-dropdown" :class="{ 'is-open': openDropdownId === row._id }">
                <button
                  type="button"
                  class="role-trigger"
                  :class="row.role === 'admin' ? 'role-admin' : 'role-user'"
                  :disabled="mutating"
                  @click.stop="toggleDropdown(row._id)"
                >
                  {{ row.role }}
                  <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </button>
                <div v-if="openDropdownId === row._id" class="dd-panel">
                  <button
                    type="button"
                    class="dd-item"
                    :class="{ 'is-active': row.role === 'user' }"
                    @click="selectRole(row, 'user')"
                  >
                    user
                  </button>
                  <button
                    type="button"
                    class="dd-item"
                    :class="{ 'is-active': row.role === 'admin' }"
                    @click="selectRole(row, 'admin')"
                  >
                    admin
                  </button>
                </div>
              </div>
            </td>
            <td>{{ row._createdAt }}</td>
            <td class="text-end">
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="mutating"
                @click="emit('delete-user', row)"
              >Delete</button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="5" class="text-center text-muted py-3">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="userPagination.page"
      :pages="userPagination.pages"
      :total="userPagination.total"
      total-label="users"
      :loading="loadingUsers"
      @go-page="(p) => emit('go-page', p)"
    />
  </section>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-row-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-row-dates {
  display: flex;
  align-items: center;
  padding-top: 0.4rem;
}

.user-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.user-link:hover {
  text-decoration: underline;
}

.role-dropdown {
  position: relative;
  display: inline-block;
}

.role-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.role-trigger i {
  font-size: 0.55rem;
  opacity: 0.6;
  transition: transform 0.15s;
}

.role-dropdown.is-open .role-trigger i {
  transform: rotate(180deg);
}

.role-trigger.role-admin {
  background: rgba(220, 38, 38, 0.1);
  color: var(--danger);
  border-color: rgba(220, 38, 38, 0.25);
}

.role-trigger.role-user {
  background: var(--surface-alt);
  color: var(--muted);
  border-color: var(--line);
}

:root.dark-theme .role-trigger.role-admin {
  background: rgba(252, 165, 165, 0.12);
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.2);
}

:root.dark-theme .role-trigger.role-user {
  background: var(--surface-alt);
  color: var(--muted);
  border-color: var(--line);
}

/* Role menu item sizing override */
.dd-panel .dd-item {
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-align: center;
}

</style>
