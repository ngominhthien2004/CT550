<script setup>
import { onMounted } from 'vue'
import { useFeedStore } from '../stores/feed.store'
import FeedList from '../components/feed/FeedList.vue'

const feedStore = useFeedStore()

onMounted(() => {
  feedStore.fetchFeed()
})
</script>

<template>
  <section class="page">
    <h2>Personal Feed</h2>
    <p v-if="feedStore.loading">Loading feed...</p>
    <p v-else-if="feedStore.error">{{ feedStore.error }}</p>
    <FeedList v-else :items="feedStore.feedItems" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 0.75rem;
}

h2 {
  margin: 0;
}
</style>
