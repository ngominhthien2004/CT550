<script setup>
import { computed } from 'vue'
import AdminActionsDropdown from './AdminActionsDropdown.vue'

defineProps({
  activeTab: {
    type: String,
    required: true,
  },
  artworkPanelFiltersOpen: {
    type: Boolean,
    required: true,
  },
  artworkQuery: {
    type: String,
    required: true,
  },
  loadingArtworks: {
    type: Boolean,
    default: false,
  },
  mutating: {
    type: Boolean,
    default: false,
  },
  artworks: {
    type: Array,
    required: true,
  },
  artworkPagination: {
    type: Object,
    required: true,
  },
  formatDate: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'toggle-filters',
  'update:artworkQuery',
  'apply-filters',
  'remove-artwork',
  'go-page',
])

function onQueryInput(event) {
  emit('update:artworkQuery', event.target.value)
}

const formattedArtworks = computed(() => {
  try {
    if (!Array.isArray(props.artworks)) return []
    return props.artworks.map(a => {
      if (!a) return null
      try {
        const formatted = props.formatDate(a.createdAt)
        return { ...a, _createdAt: formatted }
      } catch {
        return { ...a, _createdAt: '-' }
      }
    }).filter(Boolean)
  } catch {
    return []
  }
})
</script>

<template>
  <section v-show="activeTab === 'artworks'" id="admin-artwork-panel" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Artwork Moderation</h2>
      <button
        class="btn btn-sm btn-outline-secondary"
        type="button"
        :aria-expanded="artworkPanelFiltersOpen"
        aria-controls="admin-artwork-filters"
        @click="emit('toggle-filters')"
      >
        {{ artworkPanelFiltersOpen ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="artworkPanelFiltersOpen" id="admin-artwork-filters" class="filters" role="region" aria-label="Artwork filters">
      <input
        :value="artworkQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Search by title"
        aria-label="Search artworks by title"
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loadingArtworks" @click="emit('apply-filters')">Apply</button>
    </div>

    <p v-if="loadingArtworks" class="state-note">Loading artworks...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Type</th>
            <th>Age Rating</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedArtworks" :key="row._id">
            <td>{{ row.title }}</td>
            <td>{{ row.user?.displayName || row.user?.username || '-' }}</td>
            <td>{{ row.type }}</td>
            <td>{{ row.ageRating }}</td>
            <td>{{ row._createdAt }}</td>
            <td>
              <AdminActionsDropdown>
                <template #default="{ close: closeMenu }">
                  <button type="button" class="dropdown-danger" :disabled="mutating" @click="emit('remove-artwork', row._id); closeMenu()">
                    Delete
                  </button>
                </template>
              </AdminActionsDropdown>
            </td>
          </tr>
          <tr v-if="formattedArtworks.length === 0">
            <td colspan="6" class="text-center text-muted py-3">No artworks found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Artwork pagination">
      <span>Page {{ artworkPagination.page }} / {{ artworkPagination.pages }} • {{ artworkPagination.total }} artworks</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="artworkPagination.page <= 1 || loadingArtworks" @click="emit('go-page', artworkPagination.page - 1)">
          Previous
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="artworkPagination.page >= artworkPagination.pages || loadingArtworks" @click="emit('go-page', artworkPagination.page + 1)">
          Next
        </button>
      </div>
    </footer>
  </section>
</template>
