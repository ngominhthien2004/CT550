<script setup>
import { ref } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'

const isNavCollapsed = ref(true)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Messages</h1>
      <p class="text-secondary mb-0">Message center will be implemented in moderation/communication milestones.</p>
    </section>
  </MainLayoutTemplate>
</template>
