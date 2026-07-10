<script setup>
import ArtworkCard from '../artwork/ArtworkCard.vue'

defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  placeholderCount: { type: Number, default: 0 },
})
</script>

<template>
  <p v-if="loading" class="state-note">{{ $t('search.loadingResults') }}</p>
  <p v-else-if="error" class="state-note error">{{ error }}</p>

  <p v-else-if="!items.length" class="state-note">{{ $t('search.noWorksFilter') }}</p>

  <div v-else class="result-grid-wrap">
    <ArtworkCard v-for="item in items" :key="item._id" :item="item" />
  </div>
</template>

<style scoped>
.result-grid-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.state-note {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}
</style>
