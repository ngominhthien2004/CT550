<script setup>
import { computed, ref } from 'vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'
import { translateError } from '../../utils/translateError.js'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const bookStore = useBookStore()
const { showError } = useToast()
const updating = ref(false)
const removing = ref(false)

const book = computed(() => props.item?.book || {})
const price = computed(() => Number(props.item?.priceAtAdd || book.value?.price || 0))
const lineTotal = computed(() => price.value * Number(props.item?.quantity || 1))
const coverUrl = computed(() => {
  const images = book.value?.coverImages
  if (Array.isArray(images) && images.length > 0) return images[0]
  return book.value?.coverImage || '/default-book-cover.png'
})

async function updateQuantity(delta) {
  const newQty = Number(props.item?.quantity || 1) + delta
  if (newQty < 1) return

  updating.value = true
  try {
    await bookStore.updateCartItemQuantity(props.item._id, newQty)
  } catch (error) {
    showError(translateError(error, null, 'error.saveFailed'))
  } finally {
    updating.value = false
  }
}

async function remove() {
  removing.value = true
  try {
    await bookStore.removeFromCart(props.item._id)
  } catch (error) {
    showError(translateError(error, null, 'error.deleteFailed'))
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="cart-item">
    <img :src="coverUrl" :alt="book.title" class="cart-item-cover" />
    <div class="cart-item-info">
      <h4 class="cart-item-title">{{ book.title }}</h4>
      <p class="cart-item-seller">{{ book.seller?.displayName || book.seller?.username }}</p>
      <span class="cart-item-price">${{ price.toFixed(2) }}</span>
    </div>
    <div class="cart-item-actions">
      <div class="qty-control">
        <button type="button" class="qty-btn" :disabled="updating" @click="updateQuantity(-1)">
          <i class="fa-solid fa-minus"></i>
        </button>
        <span class="qty-value">{{ item.quantity }}</span>
        <button type="button" class="qty-btn" :disabled="updating" @click="updateQuantity(1)">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
      <span class="line-total">${{ lineTotal.toFixed(2) }}</span>
      <button type="button" class="btn btn-outline-danger btn-sm remove-btn" :disabled="removing" @click="remove">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.cart-item-cover {
  width: 64px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--text);
}

.cart-item-seller {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0 0 0.4rem;
}

.cart-item-price {
  font-weight: 700;
  color: var(--accent);
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.qty-btn {
  border: none;
  background: var(--surface-alt);
  color: var(--text);
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.qty-btn:disabled {
  opacity: 0.5;
}

.qty-value {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
}

.line-total {
  font-weight: 700;
  font-size: 1.05rem;
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  border-radius: 999px;
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .cart-item {
    flex-wrap: wrap;
  }

  .cart-item-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
