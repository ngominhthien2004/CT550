<script setup>
const emit = defineEmits(['go-login'])
</script>

<template>
  <section class="page-block p-3 p-md-4 d-grid gap-2">
    <h1 class="h4 mb-0">Profile</h1>
    <p class="text-secondary mb-0">You are not logged in.</p>
    <button class="btn btn-primary btn-sm justify-self-start" @click="emit('go-login')">Go to login</button>
  </section>
</template>
