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
  <section>
    <h2>Rankings</h2>

    <label>
      Period:
      <select v-model="period" @change="loadRankings">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </label>

    <p v-if="feedStore.loading">Loading rankings...</p>
    <p v-else-if="feedStore.error">{{ feedStore.error }}</p>
    <RankingsPanel v-else :items="feedStore.rankings" />
  </section>
</template>
