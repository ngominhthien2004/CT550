<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reports: { type: Array, required: true },
  reportPagination: { type: Object, required: true },
  formatDate: { type: Function, required: true },
})

const emit = defineEmits([
  'resolve-report',
  'go-page',
])

const formattedReports = computed(() =>
  props.reports.map(r => ({ ...r, _lastReportedAt: props.formatDate(r.lastReportedAt) }))
)
</script>

<template>
  <section v-show="activeTab === 'reports'" :id="'admin-panel-reports'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Report Review</h2>
    </div>

    <p v-if="loadingReports" class="state-note">Loading reports...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Requester</th>
            <th>Creator</th>
            <th>Reported By</th>
            <th>Reports</th>
            <th>Last Reported</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, $index) in formattedReports" :key="row.request?._id || $index">
            <td><code class="small">{{ row.request?._id?.slice(-8) || '-' }}</code></td>
            <td>{{ row.request?.requester?.displayName || row.request?.requester?.username || '-' }}</td>
            <td>{{ row.request?.creator?.displayName || row.request?.creator?.username || '-' }}</td>
            <td>{{ row.reportedBy?.displayName || row.reportedBy?.username || '-' }}</td>
            <td><span class="badge bg-danger-subtle text-danger-emphasis">{{ row.reportCount }}</span></td>
            <td>{{ row._lastReportedAt }}</td>
            <td>
              <button
                class="btn btn-sm btn-outline-success"
                :disabled="mutating"
                @click="emit('resolve-report', row.request?._id)"
              >
                Dismiss
              </button>
            </td>
          </tr>
          <tr v-if="reports.length === 0">
            <td colspan="7" class="text-center text-muted py-3">No pending reports.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Report pagination">
      <span>Page {{ reportPagination.page }} / {{ reportPagination.pages }} &bull; {{ reportPagination.total }} reports</span>
      <div class="pager-actions">
        <button class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page <= 1 || loadingReports" @click="emit('go-page', reportPagination.page - 1)">Previous</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page >= reportPagination.pages || loadingReports" @click="emit('go-page', reportPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>
