<script setup>
import { computed } from 'vue'
import AdminPagination from './AdminPagination.vue'
import AdminPillSelect from './AdminPillSelect.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  reportType: { type: String, required: true },
  reports: { type: Array, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reportPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  reportStatusFilter: { type: String, default: 'pending' },
  formatDate: { type: Function, default: (d) => d ? new Date(d).toLocaleDateString() : '-' },
})

const emit = defineEmits(['resolve-report', 'hide-artwork', 'go-page', 'update:report-status-filter'])

const tabValue = computed(() => props.reportType)

const config = computed(() => {
  const configs = {
    artwork: {
      title: 'Artwork Reports',
      filterLabel: 'Filter artwork reports by status',
      emptyText: 'No artwork reports found.',
      emptySlot: false,
    },
    comment: {
      title: 'Comment Reports',
      filterLabel: 'Filter comment reports by status',
      emptyText: 'No comment reports found.',
      emptySlot: false,
    },
    user: {
      title: 'User Reports',
      filterLabel: 'Filter user reports by status',
      emptyText: 'No user reports found.',
      emptySlot: false,
    },
  }
  return configs[props.reportType] || configs.artwork
})

const formattedReports = computed(() =>
  props.reports.map(r => ({
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
  <section
    v-show="activeTab === reportType"
    :id="'admin-panel-' + reportType + '-reports'"
    class="panel"
    role="tabpanel"
  >
    <div class="panel-head">
      <h2>{{ config.title }}</h2>
      <AdminPillSelect
        :model-value="reportStatusFilter"
        :options="[
          { value: 'pending', label: 'Pending' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'dismissed', label: 'Dismissed' },
          { value: '', label: 'All' },
        ]"
        :label="config.filterLabel"
        @update:model-value="onStatusFilterChange"
      />
    </div>

    <p v-if="loadingReports" class="state-note">Loading reports...</p>

    <div v-else-if="reports.length === 0" class="state-note">
      {{ config.emptyText }}
    </div>

    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <!-- Artwork columns -->
            <template v-if="reportType === 'artwork'">
              <th>Artwork</th>
            </template>
            <!-- Comment columns -->
            <template v-if="reportType === 'comment'">
              <th>Comment</th>
              <th>Artwork</th>
            </template>
            <!-- User columns -->
            <template v-if="reportType === 'user'">
              <th>Reported User</th>
            </template>
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
            <!-- Artwork: title column -->
            <td v-if="reportType === 'artwork'">
              <router-link :to="'/artworks/' + (report.artwork?._id)" class="artwork-link">
                {{ report.artwork?.title || 'Unknown' }}
              </router-link>
            </td>

            <!-- Comment: comment + artwork columns -->
            <td v-if="reportType === 'comment'" class="text-muted small" style="max-width: 200px;">
              {{ (report.target?.content || report.comment?.content || '').substring(0, 60) || '-' }}
            </td>
            <td v-if="reportType === 'comment'">
              <router-link :to="'/artworks/' + (report.target?.artwork?._id || report.comment?.artwork?._id)" class="artwork-link">
                {{ report.target?.artwork?.title || report.comment?.artwork?.title || 'Unknown' }}
              </router-link>
            </td>

            <!-- User: reported user column -->
            <td v-if="reportType === 'user'">
              {{ report.targetUser?.displayName || report.targetUser?.username || report.target?.displayName || report.target?.username || '-' }}
            </td>

            <td><span class="badge bg-warning-subtle text-warning-emphasis">{{ report.reason }}</span></td>
            <td>{{ report.reportedBy?.displayName || report.reportedBy?.username || '-' }}</td>
            <td>{{ report._createdAt }}</td>
            <td>{{ report.resolvedBy?.displayName || report.resolvedBy?.username || '-' }}</td>
            <td class="text-muted small" :title="report.resolutionNote">{{ report.resolutionNote || '-' }}</td>

            <td class="actions-cell">
              <!-- Artwork actions -->
              <template v-if="reportType === 'artwork' && report.status === 'pending'">
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

              <!-- Comment actions -->
              <template v-else-if="reportType === 'comment' && report.status === 'pending'">
                <button type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'delete')"
                  title="Delete comment and resolve report"
                >Resolve</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'dismiss')"
                  title="Dismiss report"
                >Dismiss</button>
              </template>

              <!-- User actions -->
              <template v-else-if="reportType === 'user' && report.status === 'pending'">
                <button type="button"
                  class="btn btn-sm btn-outline-warning"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'warn')"
                  title="Send warning to the reported user"
                >Warn</button>
                <button type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'ban')"
                  title="Suspend the reported user"
                >Suspend</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'dismiss')"
                  title="Dismiss report"
                >Dismiss</button>
              </template>

              <span v-else-if="report.status !== 'pending'" class="badge" :class="report.status === 'resolved' ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">
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
