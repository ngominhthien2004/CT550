<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import CartItem from '@/components/bookstore/CartItem.vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'
import { translateError } from '../../utils/translateError.js'

const { t } = useI18n()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const checkingOut = ref(false)

const items = computed(() => bookStore.cart?.items || bookStore.cartItems || [])
const loading = computed(() => bookStore.cartLoading)
const total = computed(() => bookStore.cartTotal)

async function handleCheckout() {
  checkingOut.value = true
  try {
    const url = await bookStore.checkout()
    if (url) {
      window.location.href = url
      return
    }
    showError(t('bookstore.loadFailed'))
  } catch (error) {
    showError(translateError(error, t, 'bookstore.loadFailed'))
  } finally {
    checkingOut.value = false
  }
}

async function clearCart() {
  try {
    await bookStore.emptyCart()
    showSuccess(t('bookstore.clearCart'))
  } catch (error) {
    showError(translateError(error, t, 'bookstore.loadFailed'))
  }
}

onMounted(() => {
  bookStore.fetchCart()
})
</script>

<template>
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4">
      <h1 class="page-title">{{ $t('bookstore.cart') }}</h1>

      <div v-if="loading && items.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <i class="fa-solid fa-cart-shopping empty-icon"></i>
        <p>{{ $t('bookstore.emptyCart') }}</p>
        <router-link to="/bookstore" class="btn btn-primary">{{ $t('bookstore.browseBooks') }}</router-link>
      </div>

      <template v-else>
        <div class="cart-list">
          <CartItem v-for="item in items" :key="item._id" :item="item" />
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>{{ $t('bookstore.totalItems', { count: bookStore.cartItemCount }) }}</span>
            <span class="summary-total">${{ total.toFixed(2) }}</span>
          </div>
          <div class="summary-actions">
            <button type="button" class="btn btn-outline-danger" @click="clearCart">{{ $t('bookstore.clearCart') }}</button>
            <button type="button" class="btn btn-primary" :disabled="checkingOut" @click="handleCheckout">
              {{ checkingOut ? $t('bookstore.redirecting') : $t('bookstore.checkout') }}
            </button>
          </div>
        </div>
      </template>
    </section>
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 1rem;
}

.cart-list {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
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

.cart-summary {
  border-top: 1px solid var(--line);
  padding-top: 1rem;
  display: grid;
  gap: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.15rem;
}

.summary-total {
  font-weight: 700;
  color: var(--accent);
  font-size: 1.35rem;
}

.summary-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .summary-actions {
    flex-direction: column;
  }
}
</style>
