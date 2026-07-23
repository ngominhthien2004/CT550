<script setup>
import { computed } from 'vue'
import AdminPagination from './AdminPagination.vue'
import AdminPillSelect from './AdminPillSelect.vue'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'

const props = defineProps({
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
  artworkTypeFilter: {
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
  artworkDateRange: {
    type: Object,
    default: () => ({ from: '', to: '' }),
  },
})

const emit = defineEmits([
  'toggle-filters',
  'update:artworkQuery',
  'update:artworkTypeFilter',
  'update:artworkDateRange',
  'apply-filters',
  'delete-artwork',
  'go-page',
])

function onQueryInput(event) {
  emit('update:artworkQuery', event.target.value)
}

function onTypeFilterChange(value) {
  emit('update:artworkTypeFilter', value)
  emit('apply-filters')
}

const formattedArtworks = computed(() =>
  props.artworks.map(a => ({
    ...a,
    _createdAt: props.formatDate(a.createdAt),
    _owner: a.user?.displayName || a.user?.username || '—',
    _type: a.type || '—',
  }))
)
</script>

<template>
  <section v-show="activeTab === 'artworks'" id="admin-artwork-panel" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>{{ $t('admin.artworkManagement') }}</h2>
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
      <input
        :value="artworkQuery"
        type="text"
        class="form-control form-control-sm search-input"
        :placeholder="$t('admin.searchTitle')"
        :aria-label="$t('admin.searchTitle')"
        @input="onQueryInput"
        @keyup.enter="emit('apply-filters')"
      />
      <AdminPillSelect
        :model-value="artworkTypeFilter"
        :options="[
          { value: 'all', label: $t('admin.allTypes') },
          { value: 'illust', label: $t('admin.illustration') },
          { value: 'manga', label: 'Manga' },
          { value: 'gif', label: 'GIF' },
          { value: 'novel', label: 'Novel' },
        ]"
        :label="$t('admin.filterArtworksByType')"
        @update:model-value="onTypeFilterChange"
      />
      <DateRangeFilter
        :model-value="artworkDateRange"
        compact
        @update:model-value="emit('update:artworkDateRange', $event)"
      />
      <button type="button" class="btn btn-sm btn-primary apply-btn" :disabled="loadingArtworks" @click="emit('apply-filters')">{{ $t('admin.apply') }}</button>
    </div>

    <p v-if="loadingArtworks" class="state-note">{{ $t('admin.loadingArtworks') }}</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{{ $t('admin.tableTitle') }}</th>
            <th>{{ $t('admin.tableOwner') }}</th>
            <th>{{ $t('admin.tableType') }}</th>
            <th>{{ $t('admin.tableCreated') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedArtworks" :key="row._id">
            <td>
              <router-link :to="`/artworks/${row._id}`" class="artwork-link">{{ row.title || $t('admin.untitled') }}</router-link>
            </td>
            <td>{{ row._owner }}</td>
            <td>{{ row._type }}</td>
            <td>{{ row._createdAt }}</td>
            <td class="text-end">
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="mutating"
                @click="emit('delete-artwork', row)"
              >{{ $t('admin.delete') }}</button>
            </td>
          </tr>
          <tr v-if="artworks.length === 0">
            <td colspan="5" class="text-center text-muted py-3">{{ $t('admin.noArtworks') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="artworkPagination.page"
      :pages="artworkPagination.pages"
      :total="artworkPagination.total"
      :total-label="$t('admin.artworksCount')"
      :loading="loadingArtworks"
      @go-page="(p) => emit('go-page', p)"
    />
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

.artwork-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.artwork-link:hover {
  text-decoration: underline;
}
</style>
