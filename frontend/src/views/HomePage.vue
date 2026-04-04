<script setup>
import { computed, onMounted, ref } from 'vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import HomeHeroBanner from '../components/home/HomeHeroBanner.vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeTabs from '../components/home/HomeTabs.vue'
import HomeTagStrip from '../components/home/HomeTagStrip.vue'
import { getArtworks } from '../services/api'
import {
  discoveryWorks,
  heroSlides,
  navItems,
  topTags,
} from '../assets/mock/home.mock'

const isNavCollapsed = ref(true)
const liveWorks = ref([])

const featuredWorks = computed(() =>
  liveWorks.value.length > 0 ? liveWorks.value : discoveryWorks,
)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadHomeArtworks() {
  try {
    const { data } = await getArtworks()
    if (Array.isArray(data) && data.length > 0) {
      liveWorks.value = data
    }
  } catch (_error) {
    liveWorks.value = []
  }
}

onMounted(loadHomeArtworks)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <HomeTagStrip :tags="topTags" />
    <HomeTabs />
    <HomeHeroBanner :slide="heroSlides[0]" />
    <HomeArtworkGrid :works="featuredWorks" />
  </MainLayoutTemplate>
</template>
