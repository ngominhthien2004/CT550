<template>
  <div class="app-shell">
    <router-view />
    <ToastContainer />
    <ChatBubble v-if="isAuthenticated" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
