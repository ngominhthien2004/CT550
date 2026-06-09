<script setup>
defineProps({
  activeTab: { type: String, required: true },
  artworkReports: { type: Array, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reportPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  formatDate: { type: Function, default: (d) => d ? new Date(d).toLocaleDateString() : '-' },
})
const emit = defineEmits(['resolve-report', 'hide-artwork', 'go-page'])
</script>

<template>
  <section v-show="activeTab === 'artwork-reports'" :id="'admin-panel-artwork-reports'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Artwork Reports</h2>
    </div>

    <p v-if="loadingReports" class="state-note">Loading reports...</p>

    <div v-else-if="artworkReports.length === 0" class="state-note">
      No pending artwork reports.
    </div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Artwork</th>
          <th>Type</th>
          <th>Reported By</th>
          <th>Reason</th>
          <th>Description</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="report in artworkReports" :key="report._id">
          <td>
            <router-link :to="`/artworks/${report.artwork?._id}`" class="artwork-link">
              {{ report.artwork?.title || 'Unknown' }}
            </router-link>
          </td>
          <td>{{ report.artwork?.type }}</td>
          <td>{{ report.reportedBy?.displayName || report.reportedBy?.username || '-' }}</td>
          <td><span class="badge bg-warning-subtle text-warning-emphasis">{{ report.reason }}</span></td>
          <td class="text-muted small">{{ report.description || '-' }}</td>
          <td>{{ formatDate(report.createdAt) }}</td>
          <td class="actions-cell">
            <button
              class="btn btn-sm btn-outline-danger"
              :disabled="mutating"
              @click="emit('hide-artwork', report.artwork?._id, report._id)"
              title="Hide artwork"
            >Hide</button>
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="mutating"
              @click="emit('resolve-report', report._id)"
              title="Dismiss report"
            >Dismiss</button>
          </td>
        </tr>
      </tbody>
    </table>

    <footer v-if="reportPagination.pages > 1" class="panel-footer" aria-label="Report pagination">
      <span>Page {{ reportPagination.page }} / {{ reportPagination.pages }} &bull; {{ reportPagination.total }} reports</span>
      <div class="btn-group">
        <button class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page <= 1 || loadingReports" @click="emit('go-page', reportPagination.page - 1)">Previous</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page >= reportPagination.pages || loadingReports" @click="emit('go-page', reportPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>
