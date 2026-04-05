<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ArtworkDetailCard from '../components/artwork/ArtworkDetailCard.vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { getArtworks } from '../services/api'
import { useArtworkStore } from '../stores/artwork.store'

const route = useRoute()
const artworkStore = useArtworkStore()
const isNavCollapsed = ref(true)
const relatedWorks = ref([])

const artworkId = computed(() => route.params.id)
const artwork = computed(() => artworkStore.detail)
const displayAuthor = computed(() => {
  if (!artwork.value?.user) return 'Unknown artist'
  return artwork.value.user.displayName || artwork.value.user.username || 'Unknown artist'
})

async function loadArtwork() {
  if (artworkId.value) {
    await artworkStore.fetchArtworkDetail(artworkId.value)
    await loadRelatedWorks()
  }
}

async function loadRelatedWorks() {
  try {
    const { data } = await getArtworks()
    if (!Array.isArray(data)) {
      relatedWorks.value = []
      return
    }

    relatedWorks.value = data
      .filter((item) => item?._id && item._id !== artworkId.value)
      .slice(0, 24)
  } catch (_error) {
    relatedWorks.value = []
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

onMounted(loadArtwork)
watch(artworkId, loadArtwork)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="detail-page-content d-grid gap-3">
      <p v-if="artworkStore.loading" class="text-secondary mb-0">Loading artwork detail...</p>
      <p v-else-if="artworkStore.error" class="text-danger mb-0">{{ artworkStore.error }}</p>

      <ArtworkDetailCard v-else-if="artwork" :artwork="artwork" :display-author="displayAuthor" :related-works="relatedWorks" />
      <p v-else class="text-secondary mb-0">No artwork data found.</p>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.detail-page-content {
  width: 100%;
}
</style>
