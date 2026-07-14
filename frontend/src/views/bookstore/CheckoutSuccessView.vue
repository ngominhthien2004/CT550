<script setup>
import { onMounted, ref } from 'vue'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import { useBookStore } from '@/stores/book.store.js'

const bookStore = useBookStore()
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await bookStore.fetchOrders({ limit: 1 })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4 text-center">
      <div class="success-icon">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h1 class="page-title">Payment Successful</h1>
      <p class="lead">Thank you for your purchase. Your books are now available in your order history.</p>

      <div class="d-flex justify-content-center gap-2 flex-wrap mt-3">
        <router-link to="/bookstore/orders" class="btn btn-primary">View Orders</router-link>
        <router-link to="/bookstore" class="btn btn-outline-secondary">Continue Shopping</router-link>
      </div>
    </section>
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 640px;
  margin: 0 auto;
}

.success-icon {
  font-size: 4rem;
  color: #22c55e;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.75rem;
}

.lead {
  color: var(--muted);
}
</style>
