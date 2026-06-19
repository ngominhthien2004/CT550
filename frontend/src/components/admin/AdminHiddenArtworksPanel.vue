<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: { type: String, required: true },
  hiddenArtworks: { type: Array, required: true },
  loadingHidden: { type: Boolean, default: false },
  mutating: { type: Boolean, default: false },
  hiddenPagination: { type: Object, default: () => ({ page: 1, pages: 1, total: 0 }) },
  formatDate: { type: Function, default: (d) => d ? new Date(d).toLocaleDateString() : '-' },
})
const emit = defineEmits(['unhide-artwork', 'go-page'])

const formattedHidden = computed(() =>
  props.hiddenArtworks.map(a => ({ ...a, _hiddenAt: props.formatDate(a.hiddenAt) }))
)
</script>

<template>
  <section v-show="activeTab === 'hidden-artworks'" :id="'admin-panel-hidden-artworks'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Hidden Artworks</h2>
    </div>

    <p v-if="loadingHidden" class="state-note">Loading hidden artworks...</p>

    <div v-else-if="hiddenArtworks.length === 0" class="state-note">
      No hidden artworks.
    </div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Artwork</th>
          <th>Author</th>
          <th>Hidden By</th>
          <th>Reason</th>
          <th>Hidden At</th>
          <th>Actions</th>
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
            <button
              class="btn btn-sm btn-outline-success"
              :disabled="mutating"
              @click="emit('unhide-artwork', art._id)"
            >Unhide</button>
          </td>
        </tr>
      </tbody>
    </table>

    <footer v-if="hiddenPagination.pages > 1" class="panel-footer" aria-label="Hidden artworks pagination">
      <span>Page {{ hiddenPagination.page }} / {{ hiddenPagination.pages }} &bull; {{ hiddenPagination.total }} hidden</span>
      <div class="btn-group">
        <button class="btn btn-sm btn-outline-secondary" :disabled="hiddenPagination.page <= 1 || loadingHidden" @click="emit('go-page', hiddenPagination.page - 1)">Previous</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="hiddenPagination.page >= hiddenPagination.pages || loadingHidden" @click="emit('go-page', hiddenPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>
