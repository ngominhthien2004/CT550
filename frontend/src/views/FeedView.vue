<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArtworks } from '../services/api'
import FeedList from '../components/feed/FeedList.vue'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const feedItems = ref([])

async function loadFeed() {
  loading.value = true
  error.value = ''

  try {
    const q = typeof route.query.q === 'string' ? route.query.q : ''
    const type = typeof route.query.type === 'string' ? route.query.type : ''
    const { data } = await getArtworks()
    const normalizedQuery = q.trim().toLowerCase()

    const baseItems = Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          image: item.images?.[0] || '',
        }))
      : []

    feedItems.value = baseItems.filter((item) => {
      const matchesType = type ? item.type === type : true
      const haystack = `${item.title || ''} ${item.description || ''}`.toLowerCase()
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true
      return matchesType && matchesQuery
    })
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to fetch artworks'
    feedItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeed()
})

watch(
  () => route.query.q,
  () => {
    loadFeed()
  },
)
</script>

<template>
  <section class="page">
    <h2>Explore</h2>
    <p v-if="loading">Loading feed...</p>
    <p v-else-if="error">{{ error }}</p>
    <FeedList v-else :items="feedItems" />
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
