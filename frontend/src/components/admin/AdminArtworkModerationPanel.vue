<script setup>
import { computed } from 'vue'
import AdminActionsDropdown from './AdminActionsDropdown.vue'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'

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
  artworkDateRange: {
    type: Object,
    default: () => ({ from: '', to: '' }),
  },
  formatDate: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'toggle-filters',
  'update:artworkQuery',
  'update:artworkDateRange',
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
      <h2>{{ $t('admin.artworkModeration') }}</h2>
      <button
        class="btn btn-sm btn-outline-secondary"
        type="button"
        :aria-expanded="artworkPanelFiltersOpen"
        aria-controls="admin-artwork-filters"
        @click="emit('toggle-filters')"
      >
        {{ artworkPanelFiltersOpen ? $t('admin.hideFilters') : $t('admin.showFilters') }}
      </button>
    </div>

    <div v-show="artworkPanelFiltersOpen" id="admin-artwork-filters" class="filters" role="region" aria-label="Artwork filters">
      <div class="filter-row-main">
        <input
          :value="artworkQuery"
          type="text"
          class="form-control form-control-sm"
          :placeholder="$t('admin.searchTitle')"
          :aria-label="$t('admin.searchTitle')"
          @input="onQueryInput"
          @keyup.enter="emit('apply-filters')"
        />
        <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loadingArtworks" @click="emit('apply-filters')">{{ $t('admin.apply') }}</button>
      </div>
      <div class="filter-row-dates">
        <DateRangeFilter
          :model-value="artworkDateRange"
          compact
          @update:model-value="emit('update:artworkDateRange', $event)"
        />
      </div>
    </div>

    <p v-if="loadingArtworks" class="state-note">{{ $t('admin.loadingArtworks') }}</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{{ $t('admin.tableTitle') }}</th>
            <th>{{ $t('admin.tableAuthor') }}</th>
            <th>{{ $t('admin.tableType') }}</th>
            <th>{{ $t('admin.tableAgeRating') }}</th>
            <th>{{ $t('admin.tableCreated') }}</th>
            <th>{{ $t('admin.tableAction') }}</th>
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
                    {{ $t('admin.delete') }}
                  </button>
                </template>
              </AdminActionsDropdown>
            </td>
          </tr>
          <tr v-if="formattedArtworks.length === 0">
            <td colspan="6" class="text-center text-muted py-3">{{ $t('admin.noArtworks') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Artwork pagination">
      <span>{{ $t('admin.pageOfLabel', { page: artworkPagination.page, pages: artworkPagination.pages, total: artworkPagination.total, label: $t('admin.artworksCount') }) }}</span>
      <div class="pager-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="artworkPagination.page <= 1 || loadingArtworks" @click="emit('go-page', artworkPagination.page - 1)">
          {{ $t('admin.previous') }}
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="artworkPagination.page >= artworkPagination.pages || loadingArtworks" @click="emit('go-page', artworkPagination.page + 1)">
          {{ $t('admin.next') }}
        </button>
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
