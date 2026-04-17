<script setup>
defineProps({
  artworkId: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="comments-card card border-0 shadow-sm">
    <div class="card-body d-grid gap-2">
      <div class="d-flex align-items-center justify-content-between">
        <h2 class="h6 mb-0">Comments</h2>
        <router-link class="small text-decoration-none" :to="`/artworks/${artworkId}/comments`">Open comments</router-link>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input type="text" class="form-control form-control-sm" placeholder="Leave a comment" disabled />
        <button type="button" class="btn btn-sm btn-primary" disabled>Send</button>
      </div>
    </div>
  </div>
</template>
