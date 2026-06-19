<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  commentReports: { type: Array, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reportPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  reportStatusFilter: { type: String, default: 'pending' },
  formatDate: { type: Function, default: (d) => d ? new Date(d).toLocaleDateString() : '-' },
})
const emit = defineEmits(['resolve-report', 'go-page', 'update:report-status-filter'])

const formattedReports = computed(() =>
  props.commentReports.map(r => ({
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
  <section v-show="activeTab === 'comment-reports'" :id="'admin-panel-comment-reports'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Comment Reports</h2>
      <select
        :value="reportStatusFilter"
        class="form-select form-select-sm"
        style="width: auto;"
        @change="onStatusFilterChange"
      >
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
        <option value="">All</option>
      </select>
    </div>

    <p v-if="loadingReports" class="state-note">Loading reports...</p>

    <div v-else-if="commentReports.length === 0" class="state-note">
      No comment reports found.
    </div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Comment</th>
          <th>Artwork</th>
          <th>Reported By</th>
          <th>Reason</th>
          <th>Description</th>
          <th>Date</th>
          <th>Resolved By</th>
          <th>Resolved At</th>
          <th>Note</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="report in formattedReports" :key="report._id">
          <td class="text-muted small">
            {{ report.target?.content?.substring(0, 60) || report.comment?.content?.substring(0, 60) || '-' }}
          </td>
          <td>
            <router-link :to="`/artworks/${report.target?.artwork?._id || report.comment?.artwork?._id}`" class="artwork-link">
              {{ report.target?.artwork?.title || report.comment?.artwork?.title || 'Unknown' }}
            </router-link>
          </td>
          <td>{{ report.reportedBy?.displayName || report.reportedBy?.username || '-' }}</td>
          <td><span class="badge bg-warning-subtle text-warning-emphasis">{{ report.reason }}</span></td>
          <td class="text-muted small">{{ report.description || '-' }}</td>
          <td>{{ report._createdAt }}</td>
          <td>{{ report.resolvedBy?.displayName || report.resolvedBy?.username || '-' }}</td>
          <td>{{ report._resolvedAt }}</td>
          <td class="text-muted small" :title="report.resolutionNote">{{ report.resolutionNote || '-' }}</td>
          <td class="actions-cell">
            <template v-if="report.status === 'pending'">
              <button type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="mutating"
                @click="emit('resolve-report', report._id, 'resolved')"
                title="Delete comment and resolve report"
              >Delete + Resolve</button>
              <button type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="mutating"
                @click="emit('resolve-report', report._id, 'dismissed')"
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

    <footer v-if="reportPagination.pages > 1" class="panel-footer" aria-label="Report pagination">
      <span>Page {{ reportPagination.page }} / {{ reportPagination.pages }} &bull; {{ reportPagination.total }} reports</span>
      <div class="btn-group">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page <= 1 || loadingReports" @click="emit('go-page', reportPagination.page - 1)">Previous</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page >= reportPagination.pages || loadingReports" @click="emit('go-page', reportPagination.page + 1)">Next</button>
      </div>
    </footer>
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
</style>
