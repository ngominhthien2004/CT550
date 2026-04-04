<script setup>
import { onMounted, ref } from 'vue'
import { useFeedStore } from '../stores/feed.store'
import RankingsPanel from '../components/rankings/RankingsPanel.vue'

const feedStore = useFeedStore()
const period = ref('daily')

const loadRankings = () => {
  feedStore.fetchRankings(period.value)
}

onMounted(loadRankings)
</script>

<template>
  <section class="d-grid gap-3">
    <h2 class="mb-0">Rankings</h2>

    <label class="form-label mb-0 d-grid gap-2">
      <span class="fw-semibold">Period</span>
      <select v-model="period" class="form-select" @change="loadRankings">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </label>

    <p v-if="feedStore.loading" class="text-secondary mb-0">Loading rankings...</p>
    <p v-else-if="feedStore.error" class="text-danger mb-0">{{ feedStore.error }}</p>
    <RankingsPanel v-else :items="feedStore.rankings" />
  </section>
</template>
