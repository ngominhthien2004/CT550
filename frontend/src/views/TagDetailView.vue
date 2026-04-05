<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import { navItems } from '../constants/navigation'
import { useTagStore } from '../stores/tag.store'

const route = useRoute()
const tagStore = useTagStore()
const isNavCollapsed = ref(true)

const tagName = computed(() => decodeURIComponent((route.params.tagName || '').toString()))
const tagLabel = computed(() => {
  if (tagStore.tag?.name) {
    return `#${tagStore.tag.name}`
  }
  return tagName.value ? `#${tagName.value}` : '#tag'
})
const mappedArtworks = computed(() =>
  tagStore.artworks.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadTagDetail() {
  if (!tagName.value) {
    return
  }

  await tagStore.fetchTagDetail(tagName.value)
}

onMounted(loadTagDetail)
watch(tagName, loadTagDetail)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="tag-detail d-grid gap-3">
      <div class="page-block p-3 p-md-4 d-grid gap-2">
        <h1 class="h4 mb-0">{{ tagLabel }}</h1>
        <p class="text-secondary mb-0">{{ tagStore.tag?.usageCount || 0 }} artworks in this tag</p>
      </div>

      <div v-if="tagStore.loading" class="page-block p-3 p-md-4">
        <p class="text-secondary mb-0">Loading tag detail...</p>
      </div>

      <div v-else-if="tagStore.error" class="page-block p-3 p-md-4">
        <p class="text-danger mb-0">{{ tagStore.error }}</p>
      </div>

      <div v-else-if="!mappedArtworks.length" class="page-block p-3 p-md-4">
        <p class="text-secondary mb-0">No artworks found for this tag.</p>
      </div>

      <HomeArtworkGrid v-else :works="mappedArtworks" />
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.tag-detail {
  width: 100%;
}
</style>
