<script setup>
import { ref, computed } from 'vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'

const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
  maxQuantity: {
    type: Number,
    default: 99,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const quantity = ref(1)
const adding = ref(false)

const isDisabled = computed(() => props.disabled || adding.value)

function increase() {
  if (quantity.value < props.maxQuantity) {
    quantity.value += 1
  }
}

function decrease() {
  if (quantity.value > 1) {
    quantity.value -= 1
  }
}

async function addToCart() {
  if (isDisabled.value) return

  adding.value = true
  try {
    await bookStore.addBookToCart(props.bookId, quantity.value)
    showSuccess('Added to cart')
    quantity.value = 1
  } catch (error) {
    showError(error?.response?.data?.message || 'Failed to add to cart')
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="add-to-cart">
    <div class="qty-control">
      <button type="button" class="qty-btn" :disabled="quantity <= 1 || isDisabled" @click="decrease">
        <i class="fa-solid fa-minus"></i>
      </button>
      <span class="qty-value">{{ quantity }}</span>
      <button type="button" class="qty-btn" :disabled="quantity >= maxQuantity || isDisabled" @click="increase">
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
    <button type="button" class="btn btn-primary add-btn" :disabled="isDisabled" @click="addToCart">
      <i class="fa-solid fa-cart-plus me-1"></i>
      {{ adding ? 'Adding...' : 'Add to Cart' }}
    </button>
  </div>
</template>

<style scoped>
.add-to-cart {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface);
}

.qty-btn {
  border: none;
  background: var(--surface-alt);
  color: var(--text);
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: background 0.18s ease;
}

.qty-btn:hover:not(:disabled) {
  background: var(--line);
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-value {
  min-width: 36px;
  text-align: center;
  font-weight: 600;
}

.add-btn {
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
}
</style>
