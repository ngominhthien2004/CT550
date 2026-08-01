<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import OrderItem from '@/components/bookstore/OrderItem.vue'
import AnalyticsLineChart from '@/components/dashboard/AnalyticsLineChart.vue'
import AnalyticsBarChart from '@/components/dashboard/AnalyticsBarChart.vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'
import { formatShortDate } from '@/utils/date.js'
import { translateError } from '../../utils/translateError.js'

const { t } = useI18n()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const expandedOrderId = ref('')
const becomingSeller = ref(false)

const statsPeriod = ref('30d')
const statsGroupBy = ref('day')

const sellerOrders = computed(() => bookStore.sellerOrders)
const loading = computed(() => bookStore.sellerOrdersLoading)
const sellerStats = computed(() => bookStore.sellerStats)
const statsLoading = computed(() => bookStore.sellerStatsLoading)

const summary = computed(() => sellerStats.value?.summary || {})
const totalRevenue = computed(() => Number(summary.value.totalRevenue || 0))
const totalSales = computed(() => Number(summary.value.totalSales || 0))
const totalOrders = computed(() => Number(summary.value.totalOrders || 0))
const conversionRate = computed(() => Number(summary.value.conversionRate || 0))

const revenueTrend = computed(() => sellerStats.value?.revenueTrend || {})
const revenueCurrentTotal = computed(() => {
  const value = Number(revenueTrend.value.currentTotal)
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null
})
const revenueChangePercent = computed(() => {
  const value = revenueTrend.value.changePercent
  return typeof value === 'number' ? value : null
})

const periodOptions = [
  { value: '7d', label: t('bookstore.last7Days') },
  { value: '30d', label: t('bookstore.last30Days') },
  { value: '90d', label: t('bookstore.last90Days') },
]

const groupByOptions = computed(() => [
  { value: 'day', label: t('bookstore.day') },
  { value: 'week', label: t('bookstore.week') },
  { value: 'month', label: t('bookstore.month') },
])

const revenueChartData = computed(() => {
  const trend = revenueTrend.value
  if (!trend.labels || !trend.values || trend.labels.length === 0) return null
  return {
    labels: trend.labels,
    datasets: [
      {
        label: t('bookstore.revenue'),
        data: trend.values,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHitRadius: 10,
      },
    ],
  }
})

const bestSellingChartData = computed(() => {
  const list = sellerStats.value?.bestSelling
  if (!Array.isArray(list) || list.length === 0) return null
  return {
    labels: list.map((book) => book.title?.substring(0, 30) || 'Untitled'),
    datasets: [
      {
        label: t('bookstore.revenue'),
        data: list.map((book) => Number(book.revenue) || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  }
})

function toggleOrder(orderId) {
  expandedOrderId.value = expandedOrderId.value === orderId ? '' : orderId
}

function changePeriod(period) {
  statsPeriod.value = period
  bookStore.fetchSellerStats({ period, groupBy: statsGroupBy.value })
}

function changeGroupBy(groupBy) {
  statsGroupBy.value = groupBy
  bookStore.fetchSellerStats({ period: statsPeriod.value, groupBy })
}

async function becomeSeller() {
  becomingSeller.value = true
  try {
    await bookStore.ensureSeller()
    showSuccess(t('bookstore.save'))
  } catch (error) {
    showError(translateError(error, t, 'bookstore.loadFailed'))
  } finally {
    becomingSeller.value = false
  }
}

async function updateStatus(orderId, status) {
  try {
    await bookStore.updateSellerOrderStatus(orderId, status)
    showSuccess(t('bookstore.save'))
    await Promise.all([
      bookStore.fetchSellerOrders(),
      bookStore.fetchSellerStats({ period: statsPeriod.value, groupBy: statsGroupBy.value }),
    ])
  } catch (error) {
    showError(translateError(error, t, 'bookstore.loadFailed'))
  }
}

function formatStatus(status) {
  const map = {
    pending: t('bookstore.pending'),
    paid: t('bookstore.paid'),
    fulfilled: t('bookstore.fulfilled'),
    cancelled: t('bookstore.cancelled'),
    refunded: t('bookstore.refunded'),
  }
  return map[status] || status
}

function statusClass(status) {
  const map = {
    pending: 'bg-warning text-dark',
    paid: 'bg-info text-dark',
    fulfilled: 'bg-success',
    cancelled: 'bg-secondary',
    refunded: 'bg-secondary',
  }
  return map[status] || 'bg-secondary'
}

onMounted(() => {
  bookStore.fetchSellerProfile()
  bookStore.fetchSellerOrders()
  bookStore.fetchSellerStats({ period: statsPeriod.value, groupBy: statsGroupBy.value })
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
          <button type="button" class="action-pill action-pill--post" :disabled="becomingSeller" @click="becomeSeller">
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
            <span class="stat-value">{{ totalOrders }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">{{ $t('bookstore.conversionRate') }}</span>
            <span class="stat-value">{{ conversionRate.toFixed(1) }}%</span>
          </div>
        </div>

        <div class="analytics-section">
          <div class="analytics-controls">
            <div class="period-selector">
              <button
                v-for="opt in periodOptions"
                :key="opt.value"
                type="button"
                :class="['period-btn', { active: statsPeriod === opt.value }]"
                @click="changePeriod(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
            <div class="groupby-selector">
              <span class="selector-label">{{ $t('bookstore.groupBy') }}</span>
              <div class="period-selector">
                <button
                  v-for="opt in groupByOptions"
                  :key="opt.value"
                  type="button"
                  :class="['period-btn', { active: statsGroupBy === opt.value }]"
                  @click="changeGroupBy(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="statsLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div v-else-if="bookStore.sellerStatsError" class="alert alert-danger" role="alert">
            {{ bookStore.sellerStatsError }}
          </div>

          <div v-else class="analytics-charts">
            <AnalyticsLineChart
              :title="$t('bookstore.revenueOverTime')"
              :chart-data="revenueChartData"
              :loading="statsLoading"
              :current-total="revenueCurrentTotal"
              :change-percent="revenueChangePercent"
              :height="220"
            />
            <AnalyticsBarChart
              :title="$t('bookstore.bestSelling')"
              :chart-data="bestSellingChartData"
              :loading="statsLoading"
              :height="220"
            />
          </div>
        </div>

        <div class="dashboard-actions">
          <router-link to="/bookstore/upload" class="action-pill action-pill--post action-pill--small">
            <i class="fa-solid fa-plus me-1"></i> {{ $t('bookstore.newBook') }}
          </router-link>
          <router-link to="/bookstore/manage" class="action-pill action-pill--small">
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

              <div v-if="order.status === 'pending' || order.status === 'paid'" class="status-actions">
                <span class="status-label">{{ $t('bookstore.updateStatus') }}</span>
                <template v-if="order.status === 'pending'">
                  <button type="button" class="action-pill action-pill--danger action-pill--small" @click="updateStatus(order._id, 'cancelled')">{{ $t('bookstore.cancelled') }}</button>
                </template>
                <template v-else-if="order.status === 'paid'">
                  <button type="button" class="action-pill action-pill--post action-pill--small" @click="updateStatus(order._id, 'fulfilled')">{{ $t('bookstore.markFulfilled') }}</button>
                  <button type="button" class="action-pill action-pill--danger action-pill--small" @click="updateStatus(order._id, 'refunded')">{{ $t('bookstore.refund') }}</button>
                </template>
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
  max-width: 1100px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.6rem;
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

.analytics-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.analytics-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.period-selector {
  display: flex;
  gap: 0.35rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.25rem;
}

.period-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-btn:hover {
  color: var(--text);
  background: var(--bg);
}

.period-btn.active {
  color: var(--surface);
  background: var(--accent);
}

.groupby-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selector-label {
  font-size: 0.8rem;
  color: var(--muted);
}

.analytics-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .analytics-charts {
    grid-template-columns: 1fr;
  }
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
