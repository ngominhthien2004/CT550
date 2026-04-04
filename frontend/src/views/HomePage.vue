<script setup>
import { computed, ref } from 'vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import HomeHeroBanner from '../components/home/HomeHeroBanner.vue'
import HomeTabs from '../components/home/HomeTabs.vue'
import HomeTagStrip from '../components/home/HomeTagStrip.vue'
import HomeTopNav from '../components/home/HomeTopNav.vue'
import {
  discoveryWorks,
  heroSlides,
  navItems,
  topTags,
} from '../assets/mock/home.mock'

const isNavCollapsed = ref(false)

const uploadedImageFiles = [
  '111295072_p0_master1200.jpg',
  '119926049_p0_master1200.jpg',
  '120180230_p0_master1200.jpg',
  '140754468_p0_master1200.jpg',
  '142881404_p0_master1200.jpg',
]

const uploadedWorks = computed(() =>
  uploadedImageFiles.map((fileName, index) => ({
    id: `local-${index + 1}`,
    title: `Artwork test #${index + 1}`,
    author: 'user1',
    likes: 0,
    image: `/uploads/user1/illust/${fileName}`,
  })),
)

const featuredWorks = computed(() =>
  uploadedWorks.value.length > 0 ? uploadedWorks.value : discoveryWorks,
)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}
</script>

<template>
  <div class="home-layout" :class="{ 'nav-collapsed': isNavCollapsed }">
    <aside class="left-nav page-block" :class="{ collapsed: isNavCollapsed }">
      <div class="brand-row">
        <div class="brand">IlluWrl</div>
      </div>
      <nav v-show="!isNavCollapsed">
        <a v-for="item in navItems" :key="item.id" href="#">{{ item.label }}</a>
      </nav>
      <button v-show="!isNavCollapsed" type="button" class="nav-ghost">Yêu cầu đăng nhập</button>
    </aside>

    <section class="home-main">
      <HomeTopNav site-name="IlluWrl" @toggle-sidebar="toggleLeftNav" />
      <HomeTagStrip :tags="topTags" />
      <HomeTabs />
      <HomeHeroBanner :slide="heroSlides[0]" />
      <HomeArtworkGrid :works="featuredWorks" />
    </section>
  </div>
</template>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 0.8rem;
}

.home-layout.nav-collapsed {
  grid-template-columns: 76px minmax(0, 1fr);
}

.left-nav {
  padding: 1rem 0.8rem;
  position: sticky;
  top: 0.8rem;
  height: calc(100vh - 1.6rem);
  overflow: auto;
  transition: width 0.2s ease, padding 0.2s ease;
}

.left-nav.collapsed {
  width: 76px;
  padding-inline: 0.45rem;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.brand {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4ed8;
  padding: 0.2rem 0.5rem 0.8rem;
  letter-spacing: -0.02em;
}

.left-nav.collapsed .brand {
  font-size: 1.2rem;
  padding-bottom: 0.4rem;
}

.left-nav nav {
  display: grid;
  gap: 0.2rem;
}

.left-nav a {
  text-decoration: none;
  color: #334155;
  padding: 0.6rem 0.65rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.92rem;
}

.left-nav a:hover {
  background: #edf5ff;
}

.nav-ghost {
  margin-top: 0.8rem;
  width: 100%;
  border: 1px dashed #93c5fd;
  background: #f0f7ff;
  color: #1d4ed8;
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.home-main {
  padding: 0.55rem 1rem 1rem;
  display: grid;
  gap: 0.9rem;
}

@media (max-width: 1200px) {
  .home-layout {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  .home-layout.nav-collapsed {
    grid-template-columns: 70px minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .left-nav {
    height: auto;
    position: static;
    width: 100%;
  }

  .left-nav.collapsed {
    width: 100%;
    padding-inline: 0.8rem;
  }
}
</style>
