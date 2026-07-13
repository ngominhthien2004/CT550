<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import OrderItem from '@/components/bookstore/OrderItem.vue'
import { useBookStore } from '@/stores/book.store.js'
import { formatShortDate } from '@/utils/date.js'
import { toggleNavCollapsed } from '@/utils/viewNavigation.js'

const router = useRouter()
const bookStore = useBookStore()
const isNavCollapsed = ref(true)
const expandedOrderId = ref('')

const orders = computed(() => bookStore.orders)
const loading = computed(() => bookStore.ordersLoading)

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

function toggleOrder(orderId) {
  expandedOrderId.value = expandedOrderId.value === orderId ? '' : orderId
}

function formatStatus(status) {
  const map = {
    pending: 'Pending',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
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

function viewBook(bookId) {
  router.push(`/bookstore/${bookId}`)
}

onMounted(() => {
  bookStore.fetchOrders()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="bookstore-page page-block p-3 p-md-4">
      <h1 class="page-title">Order History</h1>

      <div v-if="bookStore.ordersError" class="alert alert-danger" role="alert">
        {{ bookStore.ordersError }}
      </div>

      <div v-if="loading && orders.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <i class="fa-solid fa-receipt empty-icon"></i>
        <p>You haven't placed any orders yet.</p>
        <router-link to="/bookstore" class="btn btn-primary">Browse books</router-link>
      </div>

      <div v-else class="order-list">
        <div v-for="order in orders" :key="order._id" class="order-card">
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
              :show-download="order.status === 'completed' || order.status === 'paid'"
            />
          </div>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.bookstore-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 1rem;
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

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--line);
}
</style>
