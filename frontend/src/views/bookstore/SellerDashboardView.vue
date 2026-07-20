<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import OrderItem from '@/components/bookstore/OrderItem.vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'
import { formatShortDate } from '@/utils/date.js'

const { t } = useI18n()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const expandedOrderId = ref('')
const becomingSeller = ref(false)

const sellerOrders = computed(() => bookStore.sellerOrders)
const loading = computed(() => bookStore.sellerOrdersLoading)

function toggleOrder(orderId) {
  expandedOrderId.value = expandedOrderId.value === orderId ? '' : orderId
}

async function becomeSeller() {
  becomingSeller.value = true
  try {
    await bookStore.ensureSeller()
    showSuccess(t('bookstore.save'))
  } catch (error) {
    showError(error?.response?.data?.message || t('bookstore.loadFailed'))
  } finally {
    becomingSeller.value = false
  }
}

async function updateStatus(orderId, status) {
  try {
    await bookStore.updateSellerOrderStatus(orderId, status)
    showSuccess(t('bookstore.save'))
    await bookStore.fetchSellerOrders()
  } catch (error) {
    showError(error?.response?.data?.message || t('bookstore.loadFailed'))
  }
}

function formatStatus(status) {
  const map = {
    pending: t('bookstore.pending'),
    paid: t('bookstore.paid'),
    processing: t('bookstore.processing'),
    shipped: t('bookstore.shipped'),
    completed: t('bookstore.completed'),
    cancelled: t('bookstore.cancelled'),
    refunded: t('bookstore.refunded'),
  }
  return map[status] || status
}

function statusClass(status) {
  const map = {
    pending: 'bg-warning text-dark',
    paid: 'bg-info text-dark',
    processing: 'bg-primary',
    shipped: 'bg-primary',
    completed: 'bg-success',
    cancelled: 'bg-secondary',
    refunded: 'bg-secondary',
  }
  return map[status] || 'bg-secondary'
}

const totalRevenue = computed(() => {
  return sellerOrders.value
    .filter((o) => o.status === 'completed' || o.status === 'paid')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
})

const totalSales = computed(() => {
  return sellerOrders.value
    .filter((o) => o.status === 'completed' || o.status === 'paid')
    .reduce((sum, o) => sum + (o.items?.length || 0), 0)
})

onMounted(() => {
  bookStore.fetchSellerProfile()
  bookStore.fetchSellerOrders()
})
</script>

<template>
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4">
      <h1 class="page-title">{{ $t('bookstore.sellerDashboard') }}</h1>

      <div v-if="!bookStore.isSeller && !bookStore.sellerLoading" class="seller-onboarding">
        <div class="onboarding-card">
          <i class="fa-solid fa-store onboarding-icon"></i>
          <h2>{{ $t('bookstore.becomeSeller') }}</h2>
          <p>{{ $t('bookstore.sellDirectly') }}</p>
          <button type="button" class="btn btn-primary" :disabled="becomingSeller" @click="becomeSeller">
            {{ becomingSeller ? $t('bookstore.settingUp') : $t('bookstore.startSelling') }}
          </button>
        </div>
      </div>

      <template v-else>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">{{ $t('bookstore.revenue') }}</span>
            <span class="stat-value">${{ totalRevenue.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">{{ $t('bookstore.booksSold') }}</span>
            <span class="stat-value">{{ totalSales }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">{{ $t('bookstore.orders') }}</span>
            <span class="stat-value">{{ sellerOrders.length }}</span>
          </div>
        </div>

        <div class="dashboard-actions">
          <router-link to="/bookstore/upload" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-plus me-1"></i> {{ $t('bookstore.newBook') }}
          </router-link>
          <router-link to="/bookstore/manage" class="btn btn-outline-secondary btn-sm">
            {{ $t('bookstore.manageBooks') }}
          </router-link>
        </div>

        <h2 class="section-title">{{ $t('bookstore.ordersContainingYourBooks') }}</h2>

        <div v-if="bookStore.sellerOrdersError" class="alert alert-danger" role="alert">
          {{ bookStore.sellerOrdersError }}
        </div>

        <div v-if="loading && sellerOrders.length === 0" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else-if="sellerOrders.length === 0" class="empty-state">
          <p>{{ $t('bookstore.noOrdersYet') }}</p>
        </div>

        <div v-else class="order-list">
          <div v-for="order in sellerOrders" :key="order._id" class="order-card">
            <button type="button" class="order-header" @click="toggleOrder(order._id)">
              <div class="order-header-left">
                <span class="order-id">#{{ order._id?.slice(-8) }}</span>
                <span class="order-date">{{ formatShortDate(order.createdAt) }}</span>
              </div>
              <div class="order-header-right">
                <span class="badge" :class="statusClass(order.status)">{{ formatStatus(order.status) }}</span>
                <span class="order-total">${{ Number(order.totalAmount || 0).toFixed(2) }}</span>
                <i class="fa-solid fa-chevron-down chevron" :class="{ rotated: expandedOrderId === order._id }"></i>
              </div>
            </button>

            <div v-show="expandedOrderId === order._id" class="order-body">
              <OrderItem
                v-for="item in order.items"
                :key="item._id"
                :item="item"
                :order-id="order._id"
                :show-download="false"
              />

              <div class="status-actions">
                <span class="status-label">{{ $t('bookstore.updateStatus') }}</span>
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="updateStatus(order._id, 'processing')">{{ $t('bookstore.processing') }}</button>
                <button type="button" class="btn btn-outline-primary btn-sm" @click="updateStatus(order._id, 'shipped')">{{ $t('bookstore.shipped') }}</button>
                <button type="button" class="btn btn-outline-success btn-sm" @click="updateStatus(order._id, 'completed')">{{ $t('bookstore.completed') }}</button>
                <button type="button" class="btn btn-outline-danger btn-sm" @click="updateStatus(order._id, 'cancelled')">{{ $t('bookstore.cancelled') }}</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 1rem;
}

.seller-onboarding {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.onboarding-card {
  text-align: center;
  max-width: 420px;
  padding: 2rem;
  border: 1px dashed var(--accent);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

.onboarding-icon {
  font-size: 3rem;
  color: var(--accent);
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.dashboard-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.75rem;
}

.order-list {
  display: grid;
  gap: 0.75rem;
}

.order-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
}

.order-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: none;
  background: var(--surface-alt);
  cursor: pointer;
  text-align: left;
}

.order-header-left,
.order-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.order-id {
  font-weight: 700;
  color: var(--text);
}

.order-date {
  font-size: 0.85rem;
  color: var(--muted);
}

.order-total {
  font-weight: 700;
  color: var(--accent);
}

.chevron {
  transition: transform 0.2s ease;
  color: var(--muted);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.order-body {
  padding: 0.75rem;
  display: grid;
  gap: 0.5rem;
}

.status-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--line);
}

.status-label {
  font-size: 0.85rem;
  color: var(--muted);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}
</style>
