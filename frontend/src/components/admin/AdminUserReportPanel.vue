<script setup>
import { computed } from 'vue'
import AdminPagination from './AdminPagination.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  userReports: { type: Array, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reportPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  reportStatusFilter: { type: String, default: 'pending' },
  formatDate: { type: Function, default: (d) => d ? new Date(d).toLocaleDateString() : '-' },
})
const emit = defineEmits(['resolve-report', 'go-page', 'update:report-status-filter'])

const formattedReports = computed(() =>
  props.userReports.map(r => ({
    ...r,
    _createdAt: props.formatDate(r.createdAt),
    _resolvedAt: props.formatDate(r.resolvedAt),
  }))
)

function onStatusFilterChange(event) {
  emit('update:report-status-filter', event.target.value)
}
</script>

<template>
  <section v-show="activeTab === 'user-reports'" :id="'admin-panel-user-reports'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>User Reports</h2>
      <select
        :value="reportStatusFilter"
        class="form-select form-select-sm report-status-select"
        @change="onStatusFilterChange"
        aria-label="Filter user reports by status"
      >
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
        <option value="">All</option>
      </select>
    </div>

    <p v-if="loadingReports" class="state-note">Loading reports...</p>

    <div v-else-if="userReports.length === 0" class="state-note">
      No user reports found.
    </div>

    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Reported User</th>
            <th>Reason</th>
            <th>Reported By</th>
            <th>Date</th>
            <th>Resolved By</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in formattedReports" :key="report._id">
            <td>{{ report.targetUser?.displayName || report.targetUser?.username || report.target?.displayName || report.target?.username || '-' }}</td>
            <td><span class="badge bg-warning-subtle text-warning-emphasis">{{ report.reason }}</span></td>
            <td>{{ report.reportedBy?.displayName || report.reportedBy?.username || '-' }}</td>
            <td>{{ report._createdAt }}</td>
            <td>{{ report.resolvedBy?.displayName || report.resolvedBy?.username || '-' }}</td>
            <td class="text-muted small" :title="report.resolutionNote">{{ report.resolutionNote || '-' }}</td>
            <td class="actions-cell">
              <template v-if="report.status === 'pending'">
                <button type="button"
                  class="btn btn-sm btn-outline-warning"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'warn')"
                  title="Send warning to the reported user"
                >Warn</button>
                <button type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'suspend')"
                  title="Suspend the reported user"
                >Suspend</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'dismiss')"
                  title="Dismiss report"
                >Dismiss</button>
              </template>
              <span v-else class="badge" :class="report.status === 'resolved' ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">
                {{ report.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      v-if="reportPagination.pages > 1"
      :page="reportPagination.page"
      :pages="reportPagination.pages"
      :total="reportPagination.total"
      total-label="reports"
      :loading="loadingReports"
      @go-page="(p) => emit('go-page', p)"
    />
  </section>
</template>

<style scoped>
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.report-status-select {
  width: auto;
  min-width: 110px;
  border-radius: 999px;
  padding: 0.22rem 0.75rem;
  font-weight: 600;
  font-size: 0.8rem;
}
</style>
