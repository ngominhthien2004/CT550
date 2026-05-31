<script setup>
defineProps({
  activeTab: { type: String, required: true },
  commentPanelFiltersOpen: { type: Boolean, required: true },
  commentQuery: { type: String, required: true },
  loadingComments: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  comments: { type: Array, required: true },
  commentPagination: { type: Object, required: true },
  formatDate: { type: Function, required: true },
})

const emit = defineEmits([
  'toggle-filters',
  'update:commentQuery',
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
      <h2>Comment Moderation</h2>
      <button
        class="btn btn-sm btn-outline-secondary"
        type="button"
        :aria-expanded="commentPanelFiltersOpen"
        aria-controls="admin-comment-filters"
        @click="emit('toggle-filters')"
      >
        {{ commentPanelFiltersOpen ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="commentPanelFiltersOpen" id="admin-comment-filters" class="filters" role="region" aria-label="Comment filters">
      <input
        :value="commentQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Search by content..."
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <button class="btn btn-sm btn-outline-primary" :disabled="loadingComments" @click="emit('apply-filters')">Apply</button>
    </div>

    <p v-if="loadingComments" class="state-note">Loading comments...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Content</th>
            <th>User</th>
            <th>Artwork</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comments" :key="row._id">
            <td class="text-break" style="max-width: 300px;">{{ row.content || '(sticker)' }}</td>
            <td>{{ row.user?.displayName || row.user?.username || '-' }}</td>
            <td>{{ row.artwork?.title || '-' }}</td>
            <td>{{ formatDate(row.createdAt) }}</td>
            <td>
              <button
                class="btn btn-sm btn-outline-danger"
                :disabled="mutating"
                @click="emit('delete-comment', row._id)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="comments.length === 0">
            <td colspan="5" class="text-center text-muted py-3">No comments found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Comment pagination">
      <span>Page {{ commentPagination.page }} / {{ commentPagination.pages }} &bull; {{ commentPagination.total }} comments</span>
      <div class="pager-actions">
        <button class="btn btn-sm btn-outline-secondary" :disabled="commentPagination.page <= 1 || loadingComments" @click="emit('go-page', commentPagination.page - 1)">Previous</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="commentPagination.page >= commentPagination.pages || loadingComments" @click="emit('go-page', commentPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>
