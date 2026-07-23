<script setup>
import { computed } from 'vue'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  commentPanelFiltersOpen: { type: Boolean, required: true },
  commentQuery: { type: String, required: true },
  loadingComments: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  comments: { type: Array, required: true },
  commentPagination: { type: Object, required: true },
  commentDateRange: { type: Object, default: () => ({ from: '', to: '' }) },
  formatDate: { type: Function, required: true },
})

const formattedComments = computed(() =>
  props.comments.map(c => ({ ...c, _createdAt: props.formatDate(c.createdAt) }))
)

const emit = defineEmits([
  'toggle-filters',
  'update:commentQuery',
  'update:commentDateRange',
  'apply-filters',
  'delete-comment',
  'go-page',
])

function onQueryInput(event) {
  emit('update:commentQuery', event.target.value)
}
</script>

<template>
  <section v-show="activeTab === 'comments'" :id="'admin-panel-comments'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>{{ $t('admin.commentModeration') }}</h2>
      <button
        class="btn btn-sm btn-outline-secondary"
        type="button"
        :aria-expanded="commentPanelFiltersOpen"
        aria-controls="admin-comment-filters"
        @click="emit('toggle-filters')"
      >
        {{ commentPanelFiltersOpen ? $t('admin.hideFilters') : $t('admin.showFilters') }}
      </button>
    </div>

    <div v-show="commentPanelFiltersOpen" id="admin-comment-filters" class="filters" role="region" aria-label="Comment filters">
      <div class="filter-row-main">
        <input
          :value="commentQuery"
          type="text"
          class="form-control form-control-sm"
          :placeholder="$t('admin.searchContent')"
          :aria-label="$t('admin.searchContent')"
          @input="onQueryInput"
          @keyup.enter="emit('apply-filters')"
        />
        <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loadingComments" @click="emit('apply-filters')">{{ $t('admin.apply') }}</button>
      </div>
      <div class="filter-row-dates">
        <DateRangeFilter
          :model-value="commentDateRange"
          compact
          @update:model-value="emit('update:commentDateRange', $event)"
        />
      </div>
    </div>

    <p v-if="loadingComments" class="state-note">{{ $t('admin.loadingComments') }}</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{{ $t('admin.tableContent') }}</th>
            <th>{{ $t('admin.tableUser') }}</th>
            <th>{{ $t('admin.tableArtwork') }}</th>
            <th>{{ $t('admin.tableCreated') }}</th>
            <th>{{ $t('admin.tableAction') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedComments" :key="row._id">
            <td class="text-break" style="max-width: 300px;">{{ row.content || '(sticker)' }}</td>
            <td>{{ row.user?.displayName || row.user?.username || '-' }}</td>
            <td>{{ row.artwork?.title || '-' }}</td>
            <td>{{ row._createdAt }}</td>
            <td>
              <button type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="mutating"
                @click="emit('delete-comment', row._id)"
              >
                {{ $t('admin.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="comments.length === 0">
            <td colspan="5" class="text-center text-muted py-3">{{ $t('admin.noComments') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Comment pagination">
      <span>{{ $t('admin.pageOfLabel', { page: commentPagination.page, pages: commentPagination.pages, total: commentPagination.total, label: $t('admin.commentsCount') }) }}</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="commentPagination.page <= 1 || loadingComments" @click="emit('go-page', commentPagination.page - 1)">{{ $t('admin.previous') }}</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="commentPagination.page >= commentPagination.pages || loadingComments" @click="emit('go-page', commentPagination.page + 1)">{{ $t('admin.next') }}</button>
      </div>
    </footer>
  </section>
</template>

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
</style>
