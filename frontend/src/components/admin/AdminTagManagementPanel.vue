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
      <h2>Tag Management</h2>
      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-outline-secondary"
          type="button"
          :aria-expanded="tagPanelFiltersOpen"
          aria-controls="admin-tag-filters"
          @click="emit('toggle-filters')"
        >
          {{ tagPanelFiltersOpen ? 'Hide filters' : 'Show filters' }}
        </button>
        <button class="btn btn-sm btn-outline-info" type="button" @click="startMerge">
          Merge tags
        </button>
      </div>
    </div>

    <div v-show="tagPanelFiltersOpen" id="admin-tag-filters" class="filters" role="region" aria-label="Tag filters">
      <input
        :value="tagQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Search tag name..."
        aria-label="Search tags by name"
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loadingTags" @click="emit('apply-filters')">Apply</button>
    </div>

    <!-- Merge form -->
    <div v-if="showMergeForm" class="border rounded p-2 mb-2 bg-light">
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <AdminPillSelect
          v-model="mergeSourceId"
          :options="mergeTagOptions"
          label="Select source tag"
        />
        <span class="text-muted">&rarr;</span>
        <AdminPillSelect
          v-model="mergeTargetId"
          :options="mergeTagOptions"
          label="Select target tag"
        />
        <button type="button" class="btn btn-sm btn-success" :disabled="!mergeSourceId || !mergeTargetId || mutating" @click="doMerge">Merge</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelMerge">Cancel</button>
      </div>
      <small class="text-muted mt-1 d-block">All artworks using the source tag will be reassigned to the target tag. The source tag will be deleted.</small>
    </div>

    <!-- Edit form -->
    <div v-if="editingTag" class="border rounded p-2 mb-2 bg-light">
      <div class="mb-2">
        <label class="form-label small fw-bold mb-1">Tag Name</label>
        <input v-model="editName" type="text" class="form-control form-control-sm" placeholder="Tag name" />
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-6">
          <label class="form-label small fw-bold mb-1">VI Translation</label>
          <input v-model="editTransVi" type="text" class="form-control form-control-sm" placeholder="Tiếng Việt" />
        </div>
        <div class="col-md-6">
          <label class="form-label small fw-bold mb-1">JP Translation</label>
          <input v-model="editTransJa" type="text" class="form-control form-control-sm" placeholder="日本語" />
        </div>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-sm btn-success" :disabled="!editName.trim() || mutating" @click="saveEdit">Save</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <p v-if="loadingTags" class="state-note">Loading tags...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Usage</th>
            <th>Translations</th>
            <th>Created</th>
            <th>Actions</th>
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
                Edit
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" :disabled="mutating" @click="emit('delete-tag', row._id)">
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="tags.length === 0">
            <td colspan="5" class="text-center text-muted py-3">No tags found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Tag pagination">
      <span>Page {{ tagPagination.page }} / {{ tagPagination.pages }} &bull; {{ tagPagination.total }} tags</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="tagPagination.page <= 1 || loadingTags" @click="emit('go-page', tagPagination.page - 1)">Previous</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="tagPagination.page >= tagPagination.pages || loadingTags" @click="emit('go-page', tagPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>
