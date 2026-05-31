<script setup>
defineProps({
  activeTab: { type: String, required: true },
  paymentPanelFiltersOpen: { type: Boolean, required: true },
  paymentStatusFilter: { type: String, required: true },
  loadingPayments: { type: Boolean, default: false },
  payments: { type: Array, required: true },
  paymentPagination: { type: Object, required: true },
  formatDate: { type: Function, required: true },
})

const emit = defineEmits([
  'toggle-filters',
  'update:paymentStatusFilter',
  'apply-filters',
  'go-page',
])

function onStatusFilterChange(event) {
  emit('update:paymentStatusFilter', event.target.value)
  emit('apply-filters')
}
</script>

<template>
  <section v-show="activeTab === 'payments'" :id="'admin-panel-payments'" class="panel" role="tabpanel">
    <div class="panel-head">
      <h2>Payment Management</h2>
      <button
        class="btn btn-sm btn-outline-secondary"
        type="button"
        :aria-expanded="paymentPanelFiltersOpen"
        aria-controls="admin-payment-filters"
        @click="emit('toggle-filters')"
      >
        {{ paymentPanelFiltersOpen ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="paymentPanelFiltersOpen" id="admin-payment-filters" class="filters" role="region" aria-label="Payment filters">
      <select :value="paymentStatusFilter" class="form-select form-select-sm" @change="onStatusFilterChange">
        <option value="all">All statuses</option>
        <option value="requires_action">Requires Action</option>
        <option value="authorized">Authorized</option>
        <option value="held">Held (Escrow)</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
        <option value="released">Released</option>
        <option value="disputed">Disputed</option>
      </select>
      <button class="btn btn-sm btn-outline-primary" :disabled="loadingPayments" @click="emit('apply-filters')">Apply</button>
    </div>

    <p v-if="loadingPayments" class="state-note">Loading payments...</p>
    <div v-else class="table-wrap">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Requester</th>
            <th>Creator</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Gateway</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in payments" :key="row._id">
            <td><code class="small">{{ row._id?.slice(-8) }}</code></td>
            <td>{{ row.requester?.displayName || row.requester?.username || '-' }}</td>
            <td>{{ row.creator?.displayName || row.creator?.username || '-' }}</td>
            <td>{{ row.amount }} {{ row.currency }}</td>
            <td>
              <span class="badge" :class="statusBadgeClass(row.status)">{{ row.status }}</span>
            </td>
            <td>{{ row.gateway }}</td>
            <td>{{ formatDate(row.createdAt) }}</td>
          </tr>
          <tr v-if="payments.length === 0">
            <td colspan="7" class="text-center text-muted py-3">No payments found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer" aria-label="Payment pagination">
      <span>Page {{ paymentPagination.page }} / {{ paymentPagination.pages }} &bull; {{ paymentPagination.total }} payments</span>
      <div class="pager-actions">
        <button class="btn btn-sm btn-outline-secondary" :disabled="paymentPagination.page <= 1 || loadingPayments" @click="emit('go-page', paymentPagination.page - 1)">Previous</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="paymentPagination.page >= paymentPagination.pages || loadingPayments" @click="emit('go-page', paymentPagination.page + 1)">Next</button>
      </div>
    </footer>
  </section>
</template>

<script>
export default {
  methods: {
    statusBadgeClass(status) {
      const map = {
        requires_action: 'bg-warning-subtle text-warning-emphasis',
        authorized: 'bg-info-subtle text-info-emphasis',
        held: 'bg-primary-subtle text-primary-emphasis',
        failed: 'bg-danger-subtle text-danger-emphasis',
        refunded: 'bg-secondary-subtle text-secondary-emphasis',
        released: 'bg-success-subtle text-success-emphasis',
        disputed: 'bg-danger text-white',
      }
      return map[status] || 'bg-light text-dark'
    },
  },
}
</script>
