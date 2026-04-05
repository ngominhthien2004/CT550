<script setup>
import { computed, onMounted, ref } from 'vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import HomeHeroBanner from '../components/home/HomeHeroBanner.vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeTabs from '../components/home/HomeTabs.vue'
import HomeTagStrip from '../components/home/HomeTagStrip.vue'
import { getArtworks, getTags } from '../services/api'
import { navItems } from '../constants/navigation'
import heroImage from '../assets/hero.png'

const isNavCollapsed = ref(true)
const liveWorks = ref([])
const liveTags = ref([])
const heroSlide = {
  title: 'Featured gallery',
  image: heroImage,
}

const featuredWorks = computed(() =>
  liveWorks.value.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadHomeArtworks() {
  try {
    const { data } = await getArtworks()
    if (Array.isArray(data) && data.length > 0) {
      liveWorks.value = data
      return
    }

    liveWorks.value = []
  } catch (_error) {
    liveWorks.value = []
  }
}

async function loadHomeTags() {
  try {
    const { data } = await getTags({ limit: 12 })
    liveTags.value = Array.isArray(data)
      ? data.map((item) => `#${item.name}`)
      : []
  } catch (_error) {
    liveTags.value = []
  }
}

onMounted(async () => {
  await Promise.all([loadHomeArtworks(), loadHomeTags()])
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <HomeTagStrip :tags="liveTags" />
    <HomeTabs />
    <HomeHeroBanner :slide="heroSlide" />
    <HomeArtworkGrid :works="featuredWorks" />
  </MainLayoutTemplate>
</template>
