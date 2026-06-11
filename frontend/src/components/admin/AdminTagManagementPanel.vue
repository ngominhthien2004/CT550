<script setup>
import { ref } from 'vue'

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

function doMerge() {
  if (!mergeSourceId.value || !mergeTargetId.value) return
  emit('merge-tags', { sourceId: mergeSourceId.value, targetId: mergeTargetId.value })
  showMergeForm.value = false
  mergeSourceId.value = ''
  mergeTargetId.value = ''
}
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
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <button class="btn btn-sm btn-outline-primary" :disabled="loadingTags" @click="emit('apply-filters')">Apply</button>
    </div>

    <!-- Merge form -->
    <div v-if="showMergeForm" class="border rounded p-2 mb-2 bg-light">
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <select v-model="mergeSourceId" class="form-select form-select-sm" style="max-width:200px">
          <option value="" disabled>Select source tag</option>
          <option v-for="tag in tags" :key="tag._id" :value="tag._id">{{ tag.name }} ({{ tag.usageCount }})</option>
        </select>
        <span class="text-muted">&rarr;</span>
        <select v-model="mergeTargetId" class="form-select form-select-sm" style="max-width:200px">
          <option value="" disabled>Select target tag</option>
          <option v-for="tag in tags" :key="tag._id" :value="tag._id">{{ tag.name }} ({{ tag.usageCount }})</option>
        </select>
        <button class="btn btn-sm btn-success" :disabled="!mergeSourceId || !mergeTargetId || mutating" @click="doMerge">Merge</button>
        <button class="btn btn-sm btn-outline-secondary" @click="cancelMerge">Cancel</button>
      </div>
      <small class="text-muted mt-1 d-block">All artworks using the source tag will be reassigned to the target tag. The source tag will be deleted.</small>
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
          <tr v-for="row in tags" :key="row._id">
            <td><code>{{ row.name }}</code></td>
            <td><span class="badge bg-secondary-subtle text-secondary-emphasis">{{ row.usageCount }}</span></td>
            <td class="small">
              <span v-if="row.translations?.en" class="me-1">EN: {{ row.translations.en }}</span>
              <span v-if="row.translations?.vi" class="me-1">VI: {{ row.translations.vi }}</span>
              <span v-if="row.translations?.ja" class="me-1">JA: {{ row.translations.ja }}</span>
              <span v-if="!row.translations?.en && !row.translations?.vi && !row.translations?.ja" class="text-muted">-</span>
            </td>
            <td>{{ formatDate(row.createdAt) }}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-outline-danger" :disabled="mutating" @click="emit('delete-tag', row._id)">
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
        <button class="btn btn-sm btn-outline-secondary" :disabled="tagPagination.page <= 1 || loadingTags" @click="emit('go-page', tagPagination.page - 1)">Previous</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="tagPagination.page >= tagPagination.pages || loadingTags" @click="emit('go-page', tagPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>
