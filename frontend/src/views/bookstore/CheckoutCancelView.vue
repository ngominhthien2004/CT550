<script setup>
import { ref } from 'vue'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import BookStoreTopBar from '@/components/bookstore/BookStoreTopBar.vue'
import { toggleNavCollapsed } from '@/utils/viewNavigation.js'

const isNavCollapsed = ref(true)

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <BookStoreTopBar />
    <section class="bookstore-page page-block p-3 p-md-4 text-center">
      <div class="cancel-icon">
        <i class="fa-solid fa-circle-xmark"></i>
      </div>
      <h1 class="page-title">Payment Cancelled</h1>
      <p class="lead">Your checkout was cancelled. Your cart is still available if you want to try again.</p>

      <div class="d-flex justify-content-center gap-2 flex-wrap mt-3">
        <router-link to="/bookstore/cart" class="btn btn-primary">Back to Cart</router-link>
        <router-link to="/bookstore" class="btn btn-outline-secondary">Browse Books</router-link>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.bookstore-page {
  max-width: 640px;
  margin: 0 auto;
  /* Offset for fixed BookStoreTopBar (top: 72px + 60px height) */
  padding-top: 132px;
}

.cancel-icon {
  font-size: 4rem;
  color: var(--danger);
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
