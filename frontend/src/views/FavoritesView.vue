<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '../stores/auth.store'
import { useLikeStore } from '../stores/like.store'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

const router = useRouter()
const authStore = useAuthStore()
const likeStore = useLikeStore()

const isNavCollapsed = ref(true)
const activeType = ref('')

const user = computed(() => authStore.user)

const typeLabelMap = {
  illust: 'Illustration',
  manga: 'Manga',
  novel: 'Novel',
  gif: 'GIF',
}

const typeTabs = computed(() => {
  const bucket = new Map()

  likeStore.items.forEach((entry) => {
    const type = String(entry?.artwork?.type || '').toLowerCase()
    if (!typeLabelMap[type]) {
      return
    }
    bucket.set(type, (bucket.get(type) || 0) + 1)
  })

  return Object.keys(typeLabelMap)
    .filter((type) => bucket.has(type))
    .map((type) => ({
      value: type,
      label: typeLabelMap[type],
      count: bucket.get(type) || 0,
    }))
})

const visibleFavorites = computed(() => {
  let items
  if (!activeType.value) {
    items = likeStore.items
  } else {
    items = likeStore.items.filter((entry) => String(entry?.artwork?.type || '').toLowerCase() === activeType.value)
  }
  return items.map(entry => ({
    ...entry,
    _hasArtworkRoute: typeof entry?.artwork?._id === 'string' && objectIdPattern.test(entry.artwork._id),
  }))
})

const totalLikes = computed(() => {
  return visibleFavorites.value.reduce((total, entry) => total + Number(entry?.artwork?.likeCount || 0), 0)
})

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function hasArtworkRoute(entry) {
  return typeof entry?.artwork?._id === 'string' && objectIdPattern.test(entry.artwork._id)
}

function selectType(type) {
  activeType.value = type
}

async function goLogin() {
  await router.push('/login')
}

async function removeLatestLike() {
  if (!likeStore.items.length) {
    likeStore.error = 'No favorite item available to delete'
    return
  }

  await likeStore.removeLike(likeStore.items[0]._id)
}

async function removeLike(likeId) {
  await likeStore.removeLike(likeId)
}

async function loadFavorites() {
  if (!user.value?._id) {
    activeType.value = ''
    return
  }

  await likeStore.fetchMyLikes({ limit: 120 })
  activeType.value = typeTabs.value[0]?.value || ''
}

onMounted(() => {
  loadFavorites()
})

watch(
  () => user.value?._id,
  () => {
    loadFavorites()
  },
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="user" class="favorites-page page-block">
      <div class="favorites-wrap">
        <header class="favorites-head">
          <div>
            <h1>My Favorite</h1>
            <p>All artworks you liked, organized with the same profile template layout.</p>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="removeLatestLike">Delete latest</button>
        </header>

        <div class="favorites-overview">
          <p class="overview-item"><strong>{{ visibleFavorites.length }}</strong> favorite items</p>
          <p class="overview-item"><strong>{{ totalLikes }}</strong> total likes on current filter</p>
        </div>

        <div v-if="typeTabs.length" class="favorite-type-tabs" role="tablist" aria-label="Favorite type tabs">
          <button
            v-for="tab in typeTabs"
            :key="tab.value"
            type="button"
            class="favorite-type-tab"
            :class="{ active: tab.value === activeType }"
            role="tab"
            :aria-selected="tab.value === activeType"
            @click="selectType(tab.value)"
          >
            {{ tab.label }}
            <span>{{ tab.count }}</span>
          </button>
        </div>

        <p v-if="likeStore.loading" class="state-note">Loading favorite works...</p>
        <p v-else-if="likeStore.error" class="state-note error">{{ likeStore.error }}</p>

        <section v-else-if="visibleFavorites.length" class="favorites-grid" aria-label="Favorite artworks list">
          <article v-for="entry in visibleFavorites" :key="entry._id" class="favorite-card">
            <router-link v-if="entry._hasArtworkRoute" :to="`/artworks/${entry.artwork._id}`" class="favorite-cover-link">
              <img
                :src="entry.artwork?.images?.[0] || ''"
                :alt="entry.artwork?.title || 'Artwork'"
                loading="lazy"
              />
            </router-link>
            <img
              v-else
              :src="entry.artwork?.images?.[0] || ''"
              :alt="entry.artwork?.title || 'Artwork'"
              loading="lazy"
            />

            <router-link v-if="entry._hasArtworkRoute" :to="`/artworks/${entry.artwork._id}`" class="favorite-title">
              {{ entry.artwork?.title || 'Untitled artwork' }}
            </router-link>
            <p class="favorite-meta">{{ entry.artwork?.type || 'illust' }} · {{ entry.artwork?.ageRating || 'all' }}</p>
            <p class="favorite-author">{{ entry.artwork?.user?.username || entry.artwork?.user?.displayName || 'Unknown author' }}</p>

            <div class="favorite-foot">
              <span>
                <i class="fa-regular fa-heart" aria-hidden="true"></i>
                {{ entry.artwork?.likeCount || 0 }}
              </span>
              <button
                type="button"
                class="btn btn-sm btn-light"
                :disabled="likeStore.loading"
                :aria-label="`Remove ${entry.artwork?.title || 'artwork'} from favorites`"
                @click="removeLike(entry._id)"
              >
                Remove
              </button>
            </div>
          </article>
        </section>

        <section v-else class="favorites-empty" aria-label="Favorites list empty state">
          <i class="fa-regular fa-heart" aria-hidden="true"></i>
          <p>No favorite works yet.</p>
        </section>
      </div>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">My Favorite</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button type="button" class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.favorites-page {
  background: var(--bg);
  min-height: calc(100vh - 112px);
}

.favorites-wrap {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.35rem 1rem 2.4rem;
  display: grid;
  gap: 0.95rem;
}

.favorites-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.favorites-head h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--brand);
}

.favorites-head p {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.favorites-overview {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.overview-item {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.32rem 0.75rem;
  color: var(--text);
  background: var(--surface);
  font-size: 0.8rem;
}

.overview-item strong {
  color: var(--brand);
}

.favorite-type-tabs {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.favorite-type-tab {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.favorite-type-tab.active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0, 150, 250, 0.1);
}

.state-note {
  margin: 0;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}

.favorites-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.favorite-card {
  display: grid;
  gap: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 0.45rem;
  box-shadow: var(--shadow-sm);
}

.favorite-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 9px;
  background: var(--surface-alt);
}

.favorite-title {
  text-decoration: none;
  color: var(--text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.25;
}

.favorite-meta,
.favorite-author {
  margin: 0;
  color: var(--muted);
  font-size: 0.78rem;
}

.favorite-foot {
  margin-top: 0.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--muted);
  font-size: 0.78rem;
}

.favorite-foot span {
  display: inline-flex;
  gap: 0.32rem;
  align-items: center;
}

.favorites-empty {
  min-height: 280px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--muted);
  background: var(--surface);
}

.favorites-empty i {
  font-size: 1.65rem;
}

.favorites-empty p {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .favorites-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .favorites-wrap {
    padding-inline: 0.75rem;
  }

  .favorites-head h1 {
    font-size: 1.45rem;
  }

  .favorites-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>