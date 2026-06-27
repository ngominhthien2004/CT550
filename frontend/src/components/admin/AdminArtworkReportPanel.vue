<script setup>
import { computed } from 'vue'
import AdminPagination from './AdminPagination.vue'
import AdminPillSelect from './AdminPillSelect.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  artworkReports: { type: Array, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reportPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  reportStatusFilter: { type: String, default: 'pending' },
  formatDate: { type: Function, default: (d) => d ? new Date(d).toLocaleDateString() : '-' },
})
const emit = defineEmits(['resolve-report', 'hide-artwork', 'go-page', 'update:report-status-filter'])

const formattedReports = computed(() =>
  props.artworkReports.map(r => ({
    ...r,
    _createdAt: props.formatDate(r.createdAt),
    _resolvedAt: props.formatDate(r.resolvedAt),
  }))
)

function onStatusFilterChange(value) {
  emit('update:report-status-filter', value)
}
</script>

<template>
  <section v-show="activeTab === 'artwork'" :id="'admin-panel-artwork-reports'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Artwork Reports</h2>
      <AdminPillSelect
        :model-value="reportStatusFilter"
        :options="[
          { value: 'pending', label: 'Pending' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'dismissed', label: 'Dismissed' },
          { value: '', label: 'All' },
        ]"
        label="Filter artwork reports by status"
        @update:model-value="onStatusFilterChange"
      />
    </div>

    <p v-if="loadingReports" class="state-note">Loading reports...</p>

    <div v-else-if="artworkReports.length === 0" class="state-note">
      No artwork reports found.
    </div>

    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Artwork</th>
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
            <td>
              <router-link :to="`/artworks/${report.artwork?._id}`" class="artwork-link">
                {{ report.artwork?.title || 'Unknown' }}
              </router-link>
            </td>
            <td><span class="badge bg-warning-subtle text-warning-emphasis">{{ report.reason }}</span></td>
            <td>{{ report.reportedBy?.displayName || report.reportedBy?.username || '-' }}</td>
            <td>{{ report._createdAt }}</td>
            <td>{{ report.resolvedBy?.displayName || report.resolvedBy?.username || '-' }}</td>
            <td class="text-muted small" :title="report.resolutionNote">{{ report.resolutionNote || '-' }}</td>
            <td class="actions-cell">
              <template v-if="report.status === 'pending'">
                <button type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="mutating"
                  @click="emit('hide-artwork', report.artwork?._id, report._id)"
                  title="Hide artwork"
                >Hide</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id)"
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

.artwork-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.artwork-link:hover {
  text-decoration: underline;
}
</style>
