<script setup>
defineProps({
  overview: {
    type: Object,
    required: true,
  },
  loadingOverview: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="overview-grid">
    <article class="overview-card">
      <span>Total Users</span>
      <strong>{{ loadingOverview ? '...' : overview.totalUsers }}</strong>
    </article>
    <article class="overview-card">
      <span>Admins</span>
      <strong>{{ loadingOverview ? '...' : overview.totalAdmins }}</strong>
    </article>
    <article class="overview-card">
      <span>Premium Users</span>
      <strong>{{ loadingOverview ? '...' : overview.totalPremium }}</strong>
    </article>
    <article class="overview-card">
      <span>Artworks</span>
      <strong>{{ loadingOverview ? '...' : overview.totalArtworks }}</strong>
    </article>
    <article class="overview-card">
      <span>Comments</span>
      <strong>{{ loadingOverview ? '...' : overview.totalComments }}</strong>
    </article>
  </div>
</template>
