<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminPagination from './AdminPagination.vue'
import AdminPillSelect from './AdminPillSelect.vue'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'
import { formatShortDate } from '../../utils/date.js'

const props = defineProps({
  activeTab: { type: String, required: true },
  reportType: { type: String, required: true },
  reports: { type: Array, required: true },
  loadingReports: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  reportPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  reportStatusFilter: { type: String, default: 'pending' },
  reportDateRange: { type: Object, default: () => ({ from: '', to: '' }) },
  formatDate: { type: Function, default: (d) => d ? formatShortDate(d) : '-' },
})

const emit = defineEmits(['resolve-report', 'hide-artwork', 'go-page', 'update:report-status-filter', 'update:reportDateRange'])
const { t } = useI18n()

const tabValue = computed(() => props.reportType)

const config = computed(() => {
  const configs = {
    artwork: {
      titleKey: 'admin.artworkReports',
      filterLabelKey: 'admin.filterArtworkReportsByStatus',
      emptyTextKey: 'admin.noArtworkReports',
    },
    comment: {
      titleKey: 'admin.commentReports',
      filterLabelKey: 'admin.filterCommentReportsByStatus',
      emptyTextKey: 'admin.noCommentReports',
    },
    user: {
      titleKey: 'admin.userReports',
      filterLabelKey: 'admin.filterUserReportsByStatus',
      emptyTextKey: 'admin.noUserReports',
    },
  }
  const c = configs[props.reportType] || configs.artwork
  return {
    title: t(c.titleKey),
    filterLabel: t(c.filterLabelKey),
    emptyText: t(c.emptyTextKey),
  }
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
          { value: 'pending', label: $t('admin.statusPending') },
          { value: 'resolved', label: $t('admin.statusResolved') },
          { value: 'dismissed', label: $t('admin.statusDismissed') },
          { value: '', label: $t('admin.statusAll') },
        ]"
        :label="config.filterLabel"
        @update:model-value="onStatusFilterChange"
      />
    </div>
    <div class="filter-row-dates">
      <DateRangeFilter
        :model-value="reportDateRange"
        compact
        @update:model-value="emit('update:reportDateRange', $event)"
      />
    </div>

    <p v-if="loadingReports" class="state-note">{{ $t('admin.loadingReports') }}</p>

    <div v-else-if="reports.length === 0" class="state-note">
      {{ config.emptyText }}
    </div>

    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <!-- Artwork columns -->
            <template v-if="reportType === 'artwork'">
              <th>{{ $t('admin.tableArtwork') }}</th>
            </template>
            <!-- Comment columns -->
            <template v-if="reportType === 'comment'">
              <th>{{ $t('admin.tableComment') }}</th>
              <th>{{ $t('admin.tableArtwork') }}</th>
            </template>
            <!-- User columns -->
            <template v-if="reportType === 'user'">
              <th>{{ $t('admin.tableReportedUser') }}</th>
            </template>
            <th>{{ $t('admin.tableReason') }}</th>
            <th>{{ $t('admin.tableReportedBy') }}</th>
            <th>{{ $t('admin.tableDate') }}</th>
            <th>{{ $t('admin.tableResolvedBy') }}</th>
            <th>{{ $t('admin.tableNote') }}</th>
            <th>{{ $t('admin.tableActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in formattedReports" :key="report._id">
            <!-- Artwork: title column -->
            <td v-if="reportType === 'artwork'">
              <router-link :to="'/artworks/' + (report.artwork?._id)" class="artwork-link">
                {{ report.artwork?.title || $t('admin.unknown') }}
              </router-link>
            </td>

            <!-- Comment: comment + artwork columns -->
            <td v-if="reportType === 'comment'" class="text-muted small" style="max-width: 200px;">
              {{ (report.target?.content || report.comment?.content || '').substring(0, 60) || '-' }}
            </td>
            <td v-if="reportType === 'comment'">
              <router-link :to="'/artworks/' + (report.target?.artwork?._id || report.comment?.artwork?._id)" class="artwork-link">
                {{ report.target?.artwork?.title || report.comment?.artwork?.title || $t('admin.unknown') }}
              </router-link>
            </td>

            <!-- User: reported user column -->
            <td v-if="reportType === 'user'">
              {{ report.reportedUser?.displayName || report.reportedUser?.username || '-' }}
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
                  :title="$t('admin.hide')"
                >{{ $t('admin.hide') }}</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id)"
                  :title="$t('admin.dismiss')"
                >{{ $t('admin.dismiss') }}</button>
              </template>

              <!-- Comment actions -->
              <template v-else-if="reportType === 'comment' && report.status === 'pending'">
                <button type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'delete')"
                  :title="$t('admin.deleteCommentResolveFailed')"
                >{{ $t('admin.resolve') }}</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'dismiss')"
                  :title="$t('admin.dismiss')"
                >{{ $t('admin.dismiss') }}</button>
              </template>

              <!-- User actions -->
              <template v-else-if="reportType === 'user' && report.status === 'pending'">
                <button type="button"
                  class="btn btn-sm btn-outline-warning"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'warn')"
                  :title="$t('admin.warn')"
                >{{ $t('admin.warn') }}</button>
                <button type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'ban')"
                  :title="$t('admin.suspend')"
                >{{ $t('admin.suspend') }}</button>
                <button type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="mutating"
                  @click="emit('resolve-report', report._id, 'dismiss')"
                  :title="$t('admin.dismiss')"
                >{{ $t('admin.dismiss') }}</button>
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
      :total-label="$t('admin.reportsCount')"
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

.filter-row-dates {
  display: flex;
  align-items: center;
  padding-top: 0.4rem;
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
