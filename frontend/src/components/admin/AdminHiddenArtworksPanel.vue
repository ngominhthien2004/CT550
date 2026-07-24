<script setup>
import { computed } from 'vue'
import AdminPagination from './AdminPagination.vue'
import { formatShortDate } from '../../utils/date.js'

const props = defineProps({
  activeTab: { type: String, required: true },
  hiddenArtworks: { type: Array, required: true },
  loadingHidden: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  hiddenPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  formatDate: { type: Function, default: (d) => d ? formatShortDate(d) : '-' },
})
const emit = defineEmits(['unhide-artwork', 'go-page'])

const formattedHidden = computed(() =>
  props.hiddenArtworks.map(a => ({ ...a, _hiddenAt: props.formatDate(a.hiddenAt) }))
)
</script>

<template>
  <section v-show="activeTab === 'hidden'" :id="'admin-panel-hidden-artworks'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>{{ $t('admin.hiddenArtworks') }}</h2>
    </div>

    <p v-if="loadingHidden" class="state-note">{{ $t('admin.loadingHidden') }}</p>

    <div v-else-if="hiddenArtworks.length === 0" class="state-note">
      {{ $t('admin.noHiddenArtworks') }}
    </div>

    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{{ $t('admin.tableArtwork') }}</th>
            <th>{{ $t('admin.tableAuthor') }}</th>
            <th>{{ $t('admin.tableHiddenBy') }}</th>
            <th>{{ $t('admin.tableReason') }}</th>
            <th>{{ $t('admin.tableHiddenAt') }}</th>
            <th>{{ $t('admin.tableActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="art in formattedHidden" :key="art._id">
            <td>
              <router-link :to="`/artworks/${art._id}`" class="artwork-link">
                {{ art.title }}
              </router-link>
            </td>
            <td>{{ art.user?.displayName || art.user?.username || '-' }}</td>
            <td>{{ art.hiddenBy?.displayName || art.hiddenBy?.username || '-' }}</td>
            <td class="text-muted small">{{ art.hiddenReason || '-' }}</td>
            <td>{{ art._hiddenAt }}</td>
            <td class="actions-cell">
              <button type="button"
                class="btn btn-sm btn-outline-success"
                :disabled="mutating"
                @click="emit('unhide-artwork', art._id)"
              >{{ $t('admin.unhide') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      v-if="hiddenPagination.pages > 1"
      :page="hiddenPagination.page"
      :pages="hiddenPagination.pages"
      :total="hiddenPagination.total"
      :total-label="$t('admin.hiddenCount')"
      :loading="loadingHidden"
      @go-page="(p) => emit('go-page', p)"
    />
  </section>
</template>

<style scoped>
.artwork-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.artwork-link:hover {
  text-decoration: underline;
}
</style>
