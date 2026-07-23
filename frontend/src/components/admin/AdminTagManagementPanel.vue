<script setup>
import { ref, computed } from 'vue'
import AdminPillSelect from './AdminPillSelect.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  tagPanelFiltersOpen: { type: Boolean, required: true },
  tagQuery: { type: String, required: true },
  loadingTags: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  tags: { type: Array, required: true },
  tagPagination: { type: Object, required: true },
  formatDate: { type: Function, required: true },
})

const emit = defineEmits([
  'toggle-filters',
  'update:tagQuery',
  'apply-filters',
  'edit-tag',
  'merge-tags',
  'delete-tag',
  'go-page',
])

const mergeSourceId = ref('')
const mergeTargetId = ref('')
const showMergeForm = ref(false)
const editingTag = ref(null)
const editName = ref('')
const editTransVi = ref('')
const editTransJa = ref('')

const mergeTagOptions = computed(() =>
  props.tags.map(t => ({ value: t._id, label: `${t.name} (${t.usageCount})` }))
)

function onQueryInput(event) {
  emit('update:tagQuery', event.target.value)
}

function startMerge() {
  showMergeForm.value = true
}

function cancelMerge() {
  showMergeForm.value = false
  mergeSourceId.value = ''
  mergeTargetId.value = ''
}

function startEdit(tag) {
  editingTag.value = tag
  editName.value = tag.name || ''
  editTransVi.value = tag.translations?.vi || ''
  editTransJa.value = tag.translations?.ja || ''
}

function cancelEdit() {
  editingTag.value = null
  editName.value = ''
  editTransVi.value = ''
  editTransJa.value = ''
}

function saveEdit() {
  if (!editingTag.value || !editName.value.trim()) return
  emit('edit-tag', {
    tagId: editingTag.value._id,
    name: editName.value.trim(),
    translations: {
      en: editName.value.trim(),
      vi: editTransVi.value.trim(),
      ja: editTransJa.value.trim(),
    },
  })
  cancelEdit()
}

function doMerge() {
  if (!mergeSourceId.value || !mergeTargetId.value) return
  emit('merge-tags', { sourceId: mergeSourceId.value, targetId: mergeTargetId.value })
  showMergeForm.value = false
  mergeSourceId.value = ''
  mergeTargetId.value = ''
}

const formattedTags = computed(() =>
  props.tags.map(t => ({ ...t, _createdAt: props.formatDate(t.createdAt) }))
)
</script>

<template>
  <section v-show="activeTab === 'tags'" :id="'admin-panel-tags'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>{{ $t('admin.tagManagement') }}</h2>
      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-outline-secondary"
          type="button"
          :aria-expanded="tagPanelFiltersOpen"
          aria-controls="admin-tag-filters"
          @click="emit('toggle-filters')"
        >
          {{ tagPanelFiltersOpen ? $t('admin.hideFilters') : $t('admin.showFilters') }}
        </button>
        <button class="btn btn-sm btn-outline-info" type="button" @click="startMerge">
          {{ $t('admin.mergeTags') }}
        </button>
      </div>
    </div>

    <div v-show="tagPanelFiltersOpen" id="admin-tag-filters" class="filters" role="region" aria-label="Tag filters">
      <input
        :value="tagQuery"
        type="text"
        class="form-control form-control-sm search-input"
        :placeholder="$t('admin.searchTag')"
        :aria-label="$t('admin.searchTag')"
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <button type="button" class="btn btn-sm btn-primary apply-btn" :disabled="loadingTags" @click="emit('apply-filters')">{{ $t('admin.apply') }}</button>
    </div>

    <!-- Merge form -->
    <div v-if="showMergeForm" class="border rounded p-2 mb-2 bg-light">
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <AdminPillSelect
          v-model="mergeSourceId"
          :options="mergeTagOptions"
          :label="$t('admin.selectSourceTag')"
        />
        <span class="text-muted">&rarr;</span>
        <AdminPillSelect
          v-model="mergeTargetId"
          :options="mergeTagOptions"
          :label="$t('admin.selectTargetTag')"
        />
        <button type="button" class="btn btn-sm btn-success" :disabled="!mergeSourceId || !mergeTargetId || mutating" @click="doMerge">{{ $t('admin.merge') }}</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelMerge">{{ $t('admin.cancel') }}</button>
      </div>
      <small class="text-muted mt-1 d-block">{{ $t('admin.mergeDescription') }}</small>
    </div>

    <!-- Edit form -->
    <div v-if="editingTag" class="tag-edit-form">
      <div class="mb-2">
        <label class="form-label small fw-bold mb-1">{{ $t('admin.tagName') }}</label>
        <input v-model="editName" type="text" class="form-control form-control-sm" :placeholder="$t('admin.tagName')" />
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-6">
          <label class="form-label small fw-bold mb-1">{{ $t('admin.viTranslation') }}</label>
          <input v-model="editTransVi" type="text" class="form-control form-control-sm" placeholder="Tiếng Việt" />
        </div>
        <div class="col-md-6">
          <label class="form-label small fw-bold mb-1">{{ $t('admin.jpTranslation') }}</label>
          <input v-model="editTransJa" type="text" class="form-control form-control-sm" placeholder="日本語" />
        </div>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-sm btn-success" :disabled="!editName.trim() || mutating" @click="saveEdit">{{ $t('admin.save') }}</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelEdit">{{ $t('admin.cancel') }}</button>
      </div>
    </div>

    <p v-if="loadingTags" class="state-note">{{ $t('admin.loadingTags') }}</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{{ $t('admin.tableName') }}</th>
            <th>{{ $t('admin.tableUsage') }}</th>
            <th>{{ $t('admin.tableTranslations') }}</th>
            <th>{{ $t('admin.tableCreated') }}</th>
            <th>{{ $t('admin.tableActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedTags" :key="row._id">
            <td><router-link :to="'/tags/' + encodeURIComponent(row.name)" class="tag-link"><code>{{ row.name }}</code></router-link></td>
            <td><span class="badge bg-secondary-subtle text-secondary-emphasis">{{ row.usageCount }}</span></td>
            <td class="small">
              <span v-if="row.translations?.vi" class="me-1">VI: {{ row.translations.vi }}</span>
              <span v-if="row.translations?.ja" class="me-1">JP: {{ row.translations.ja }}</span>
              <span v-if="!row.translations?.vi && !row.translations?.ja" class="text-muted">-</span>
            </td>
            <td>{{ row._createdAt }}</td>
            <td class="actions-cell">
              <button type="button" class="btn btn-sm btn-outline-primary me-1" :disabled="mutating" @click="startEdit(row)">
                {{ $t('admin.edit') }}
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" :disabled="mutating" @click="emit('delete-tag', row._id)">
                {{ $t('admin.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="tags.length === 0">
            <td colspan="5" class="text-center text-muted py-3">{{ $t('admin.noTagsFound') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Tag pagination">
      <span>{{ $t('admin.pageOfLabel', { page: tagPagination.page, pages: tagPagination.pages, total: tagPagination.total, label: $t('admin.tagsCount') }) }}</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="tagPagination.page <= 1 || loadingTags" @click="emit('go-page', tagPagination.page - 1)">{{ $t('admin.previous') }}</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="tagPagination.page >= tagPagination.pages || loadingTags" @click="emit('go-page', tagPagination.page + 1)">{{ $t('admin.next') }}</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  flex: 1 1 180px;
  min-width: 0;
}

.apply-btn {
  white-space: nowrap;
  margin-left: auto;
}

.tag-edit-form {
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.tag-edit-form .form-label {
  color: var(--text);
}

.tag-edit-form .form-control {
  background: var(--surface);
  border-color: var(--line);
  color: var(--text);
}

.tag-edit-form .form-control:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
</style>
