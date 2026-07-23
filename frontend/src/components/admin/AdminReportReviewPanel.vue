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
  <section v-show="activeTab === 'request'" :id="'admin-panel-reports'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>{{ $t('admin.reportReview') }}</h2>
    </div>

    <p v-if="loadingReports" class="state-note">{{ $t('admin.loadingReports') }}</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{{ $t('admin.tableRequestId') }}</th>
            <th>{{ $t('admin.tableRequester') }}</th>
            <th>{{ $t('admin.tableCreator') }}</th>
            <th>{{ $t('admin.tableReportedBy') }}</th>
            <th>{{ $t('admin.tableReports') }}</th>
            <th>{{ $t('admin.tableLastReported') }}</th>
            <th>{{ $t('admin.tableAction') }}</th>
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
              <button type="button"
                class="btn btn-sm btn-outline-success"
                :disabled="mutating"
                @click="emit('resolve-report', row.request?._id)"
              >
                {{ $t('admin.dismiss') }}
              </button>
            </td>
          </tr>
          <tr v-if="reports.length === 0">
            <td colspan="7" class="text-center text-muted py-3">{{ $t('admin.noPendingReports') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Report pagination">
      <span>{{ $t('admin.pageOfLabel', { page: reportPagination.page, pages: reportPagination.pages, total: reportPagination.total, label: $t('admin.reportsCount') }) }}</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page <= 1 || loadingReports" @click="emit('go-page', reportPagination.page - 1)">{{ $t('admin.previous') }}</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="reportPagination.page >= reportPagination.pages || loadingReports" @click="emit('go-page', reportPagination.page + 1)">{{ $t('admin.next') }}</button>
      </div>
    </footer>
  </section>
</template>
