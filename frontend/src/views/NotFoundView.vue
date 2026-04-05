<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'

const route = useRoute()
const isNavCollapsed = ref(true)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="not-found-wrap page-block p-4 p-md-5 text-center">
      <p class="error-code mb-2">404</p>
      <h1 class="h3 mb-2">Page not found</h1>
      <p class="text-secondary mb-4">The route <strong>{{ route.fullPath }}</strong> does not exist.</p>
      <div class="d-flex justify-content-center gap-2 flex-wrap">
        <router-link to="/" class="btn btn-primary">Back to home</router-link>
        <router-link to="/feed" class="btn btn-outline-secondary">Go to feed</router-link>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.not-found-wrap {
  width: min(740px, 100%);
  margin: 1rem 0;
}

.error-code {
  font-size: clamp(2rem, 7vw, 4rem);
  font-weight: 700;
  line-height: 1;
  color: #1d4ed8;
}
</style>
