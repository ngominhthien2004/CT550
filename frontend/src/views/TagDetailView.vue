<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import HomeArtworkGrid from '../components/home/HomeArtworkGrid.vue'
import { navItems } from '../constants/navigation'
import { useTagStore } from '../stores/tag.store'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const tagStore = useTagStore()
const authStore = useAuthStore()
const isNavCollapsed = ref(true)
const FAVORITE_TAG_KEY = 'illuwrl.favoriteTags'
const favoriteTagKey = computed(() => {
  const userId = authStore.user?._id || 'guest'
  return `${FAVORITE_TAG_KEY}.${userId}`
})

const tagName = computed(() => decodeURIComponent((route.params.tagName || '').toString()))
const tagLabel = computed(() => {
  if (tagStore.tag?.name) {
    return `#${tagStore.tag.name}`
  }
  return tagName.value ? `#${tagName.value}` : '#tag'
})
const favoriteTagName = computed(() => (tagStore.tag?.name || tagName.value || '').trim())
const isFavoriteTag = ref(false)
const mappedArtworks = computed(() =>
  tagStore.artworks.map((item) => ({
    ...item,
    image: item.images?.[0] || '',
  })),
)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function loadFavoriteTagStatus() {
  if (!favoriteTagName.value) {
    isFavoriteTag.value = false
    return
  }

  try {
    const raw = localStorage.getItem(favoriteTagKey.value)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) {
      isFavoriteTag.value = false
      return
    }

    isFavoriteTag.value = parsed.some((tag) => tag?.label === favoriteTagName.value)
  } catch (_error) {
    isFavoriteTag.value = false
  }
}

async function toggleFavoriteTag() {
  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  if (!favoriteTagName.value) {
    return
  }

  try {
    const raw = localStorage.getItem(favoriteTagKey.value)
    const parsed = JSON.parse(raw || '[]')
    const list = Array.isArray(parsed) ? parsed.filter((tag) => tag?.label) : []
    const existingIndex = list.findIndex((tag) => tag.label === favoriteTagName.value)
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1)
      localStorage.setItem(favoriteTagKey.value, JSON.stringify(list))
      isFavoriteTag.value = false
      return
    }

    if (list.length >= 10) {
      return
    }

    list.unshift({
      label: favoriteTagName.value,
      sub: `#${favoriteTagName.value}`,
    })
    localStorage.setItem(favoriteTagKey.value, JSON.stringify(list))
    isFavoriteTag.value = true
  } catch (_error) {
    // Ignore storage errors.
  }
}

async function loadTagDetail() {
  if (!tagName.value) {
    return
  }

  await tagStore.fetchTagDetail(tagName.value)
  loadFavoriteTagStatus()
}

onMounted(loadTagDetail)
watch(tagName, loadTagDetail)
watch(favoriteTagKey, loadFavoriteTagStatus)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="tag-detail d-grid gap-3">
      <div class="page-block p-3 p-md-4 d-grid gap-2">
        <div class="tag-head">
          <div>
            <h1 class="h4 mb-0">{{ tagLabel }}</h1>
            <p class="text-secondary mb-0">{{ tagStore.tag?.usageCount || 0 }} artworks in this tag</p>
          </div>
          <button
            type="button"
            class="favorite-tag-btn"
            @click="toggleFavoriteTag"
          >
            {{ isFavoriteTag ? 'Remove from favorite tag' : 'Add to favorite tag' }}
          </button>
        </div>
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

.tag-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.favorite-tag-btn {
  border: 1px solid #d8e1ef;
  background: #fff;
  color: #1f2937;
  border-radius: 999px;
  padding: 0.42rem 0.85rem;
  font-weight: 700;
  font-size: 0.86rem;
}

.favorite-tag-btn:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
}
</style>
