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
      <span>{{ $t('admin.overviewTotalUsers') }}</span>
      <strong>{{ loadingOverview ? '...' : overview.totalUsers }}</strong>
    </article>
    <article class="overview-card">
      <span>{{ $t('admin.overviewAdmins') }}</span>
      <strong>{{ loadingOverview ? '...' : overview.totalAdmins }}</strong>
    </article>

    <article class="overview-card">
      <span>{{ $t('admin.overviewArtworks') }}</span>
      <strong>{{ loadingOverview ? '...' : overview.totalArtworks }}</strong>
    </article>
    <article class="overview-card">
      <span>{{ $t('admin.overviewComments') }}</span>
      <strong>{{ loadingOverview ? '...' : overview.totalComments }}</strong>
    </article>
  </div>
</template>
