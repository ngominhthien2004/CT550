<template>
  <div class="app-shell">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup>
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
