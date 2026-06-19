<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth.store'

const props = defineProps({
  searchHistory: {
    type: Array,
    default: () => [],
  },
  filteredSuggestions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['choose-item', 'delete-item', 'clear-history'])

// LocalStorage key constant (not a secret)
const FAVORITE_TAG_KEY = 'illuwrl.favoriteTags'
const favoriteTagList = ref([])
const isFavoriteEditOpen = ref(false)
const authStore = useAuthStore()
const favoriteTagKey = computed(() => {
  const userId = authStore.user?._id || 'guest'
  return `${FAVORITE_TAG_KEY}.${userId}`
})


const popularIllustTags = [
  { label: '#anime boy', image: 'https://picsum.photos/seed/ct550-illu1/150/88' },
  { label: '#love story', image: 'https://picsum.photos/seed/ct550-illu2/150/88' },
  { label: '#nakamu', image: 'https://picsum.photos/seed/ct550-illu3/150/88' },
  { label: '#pastel mood', image: 'https://picsum.photos/seed/ct550-illu4/150/88' },
]

const popularNovelTags = ['#isekai romance', '#dark fantasy', '#coming of age', '#slow burn', '#slice of life']

function openFavoriteEdit() {
  isFavoriteEditOpen.value = true
}

function closeFavoriteEdit() {
  isFavoriteEditOpen.value = false
}

function removeFavoriteTag(label) {
  favoriteTagList.value = favoriteTagList.value.filter((tag) => tag.label !== label)
}

function loadFavoriteTags() {
  try {
    const raw = localStorage.getItem(favoriteTagKey.value)
    const parsed = JSON.parse(raw || '[]')
    if (Array.isArray(parsed) && parsed.length) {
      favoriteTagList.value = parsed.filter((tag) => tag?.label)
      return
    }
  } catch (_error) {
    // Fall back to defaults when local storage has invalid data.
  }

  favoriteTagList.value = []
}

onMounted(loadFavoriteTags)
watch(favoriteTagKey, loadFavoriteTags)

watch(
  () => JSON.stringify(favoriteTagList.value),
  (serialized) => {
    localStorage.setItem(favoriteTagKey.value, serialized)
  },
)
</script>

<template>
  <div class="history-panel" role="listbox" aria-label="Search history">
    <div class="history-head">
      <strong>History</strong>
      <button v-if="props.searchHistory.length" type="button" @click="emit('clear-history')">Clear history</button>
    </div>

    <template v-if="props.searchHistory.length">
      <button
        v-for="item in props.searchHistory"
        :key="item"
        type="button"
        class="history-item"
        @click="emit('choose-item', item)"
      >
        <span>{{ item }}</span>
        <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
        <span
          class="history-remove"
          role="button"
          tabindex="0"
          @click.stop="emit('delete-item', item)"
          @keydown.enter.prevent="emit('delete-item', item)"
        >
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </span>
      </button>
    </template>

    <div v-else class="history-empty">
      <p class="mb-0">No recent search yet.</p>
      <p class="mb-0">Try one of these:</p>
    </div>

    <button
      v-for="item in props.filteredSuggestions"
      :key="item"
      type="button"
      class="history-suggestion"
      @click="emit('choose-item', item)"
    >
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <span>{{ item }}</span>
    </button>

    <button type="button" class="history-view-more">View more</button>

    <section class="panel-block">
      <div class="panel-block-head">
        <strong>Your favorite tags</strong>
        <button type="button" @click="openFavoriteEdit">Edit</button>
      </div>
      <div class="favorite-tags">
        <button
          v-for="tag in favoriteTagList"
          :key="tag.label"
          type="button"
          class="favorite-tag"
          @click="emit('choose-item', tag.label)"
        >
          <span>{{ tag.label }}</span>
          <small>{{ tag.sub }}</small>
        </button>
        <p v-if="!favoriteTagList.length" class="favorite-empty">No favorite tags yet.</p>
      </div>
    </section>

    <section class="panel-block">
      <div class="panel-block-head">
        <strong>Popular illust tags</strong>
      </div>
      <div class="popular-grid">
        <button
          v-for="tag in popularIllustTags"
          :key="tag.label"
          type="button"
          class="popular-item"
          @click="emit('choose-item', tag.label)"
        >
          <img :src="tag.image" :alt="tag.label" loading="lazy" />
          <span>{{ tag.label }}</span>
        </button>
      </div>
    </section>

    <section class="panel-block">
      <div class="panel-block-head">
        <strong>Popular novel tags</strong>
      </div>
      <div class="novel-tags">
        <button
          v-for="tag in popularNovelTags"
          :key="tag"
          type="button"
          class="novel-tag"
          @click="emit('choose-item', tag)"
        >
          {{ tag }}
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="isFavoriteEditOpen" class="favorite-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit favorite tags">
        <div class="favorite-modal-card">
          <button type="button" class="favorite-modal-close" aria-label="Close" @click="closeFavoriteEdit">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
          <h3>Your favorite tags</h3>
          <p class="favorite-count">{{ favoriteTagList.length }}/10</p>

          <div class="favorite-modal-list">
            <article v-for="tag in favoriteTagList" :key="`modal-${tag.label}`" class="favorite-modal-item">
              <div>
                <strong>{{ tag.label }}</strong>
                <p>{{ tag.sub }}</p>
              </div>
              <button type="button" aria-label="Remove tag" @click="removeFavoriteTag(tag.label)">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </article>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ========================================
   Pixiv Charcoal — Search History Panel
   ======================================== */

.history-panel {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  z-index: 40;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  max-height: min(72vh, 620px);
  overflow: auto;
  padding: 0.35rem;
}

/* --- History Header --- */
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0.55rem;
  color: #474747;
}

.history-head strong {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #858585;
}

.history-head button {
  border: none;
  background: transparent;
  color: #858585;
  font-size: 0.72rem;
}

.history-head button:hover {
  color: #0096fa;
}

/* --- Empty State --- */
.history-empty {
  padding: 0.35rem 0.55rem 0.5rem;
  color: #858585;
  font-size: 0.8rem;
  display: grid;
  gap: 0.15rem;
}

/* --- History Items --- */
.history-item {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 0.45rem 0.55rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.45rem;
  color: #474747;
  text-align: left;
  font-size: 0.84rem;
}

.history-item:hover,
.history-item:focus-visible {
  background: #f5f5f5;
}

.history-item > span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item i {
  color: #858585;
}

.history-remove {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.history-remove:hover {
  background: #f5f5f5;
}

/* --- Suggestions --- */
.history-suggestion {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
  display: inline-flex;
  align-items: center;
  gap: 0.46rem;
  color: #858585;
  text-align: left;
  font-size: 0.82rem;
}

.history-suggestion:hover,
.history-suggestion:focus-visible {
  background: #f5f5f5;
}

.history-suggestion i {
  font-size: 14px;
  width: 14px;
}

/* --- View More --- */
.history-view-more {
  width: 100%;
  border: none;
  background: transparent;
  color: #3d7699;
  padding: 0.5rem 0.55rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.84rem;
  transition: background 0.15s;
}

.history-view-more:hover {
  background: #f5f5f5;
}

/* --- Panel Sections --- */
.panel-block {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 0.2rem;
  padding: 0.75rem 0.55rem 0.45rem;
}

.panel-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
}

.panel-block-head strong {
  color: #474747;
  font-size: 0.9rem;
  font-weight: 600;
}

.panel-block-head button {
  border: none;
  background: transparent;
  color: #858585;
  font-size: 0.78rem;
}

.panel-block-head button:hover {
  color: #0096fa;
}

/* --- Favorite Tags (Pixiv accent style) --- */
.favorite-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.favorite-empty {
  margin: 0;
  color: #858585;
  font-size: 0.78rem;
}

.favorite-tag {
  border: 1px solid rgba(0, 150, 250, 0.2);
  background: rgba(0, 150, 250, 0.06);
  color: #0096fa;
  border-radius: 6px;
  min-width: 80px;
  text-align: left;
  padding: 0.4rem 0.55rem;
  display: grid;
  line-height: 1.05;
  transition: background 0.15s, border-color 0.15s;
}

.favorite-tag:hover {
  background: rgba(0, 150, 250, 0.12);
  border-color: rgba(0, 150, 250, 0.4);
}

.favorite-tag span {
  font-weight: 600;
  font-size: 0.84rem;
}

.favorite-tag small {
  opacity: 0.7;
  font-size: 0.72rem;
  color: #474747;
}

/* --- Popular Illust Tags Grid --- */
.popular-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
}

.popular-item {
  border: none;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  display: grid;
  padding: 0;
  text-align: left;
  transition: opacity 0.15s;
}

.popular-item:hover {
  opacity: 0.85;
}

.popular-item img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.popular-item span {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.72rem;
  padding: 0.22rem 0.34rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Novel Tags --- */
.novel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.novel-tag {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: transparent;
  color: #474747;
  border-radius: 6px;
  padding: 0.26rem 0.55rem;
  font-size: 0.78rem;
  transition: background 0.15s;
}

.novel-tag:hover {
  background: #f5f5f5;
}

/* --- Favorite Tags Modal --- */
.favorite-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(0, 0, 0, 0.3);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.favorite-modal-card {
  width: min(520px, 92vw);
  min-height: 320px;
  max-height: 78vh;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  padding: 0.85rem 1.15rem 1rem;
  position: relative;
  overflow: auto;
}

.favorite-modal-card h3 {
  margin: 0;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #1f1f1f;
}

.favorite-count {
  text-align: right;
  margin: 0.4rem 0 0.3rem;
  color: #858585;
  font-size: 0.9rem;
  font-weight: 500;
}

.favorite-modal-close {
  position: absolute;
  top: 0.62rem;
  right: 0.68rem;
  border: none;
  background: transparent;
  color: #858585;
  font-size: 1.4rem;
  line-height: 1;
}

.favorite-modal-list {
  display: grid;
  gap: 0.3rem;
}

.favorite-modal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0;
}

.favorite-modal-item strong {
  color: #1f1f1f;
  font-size: 1rem;
  line-height: 1.2;
}

.favorite-modal-item p {
  margin: 0.1rem 0 0;
  color: #858585;
  font-size: 0.82rem;
}

.favorite-modal-item button {
  border: none;
  background: transparent;
  color: #858585;
  font-size: 1.1rem;
  padding: 0.1rem 0.24rem;
}

.favorite-modal-item button:hover {
  color: #0096fa;
}

@media (max-width: 920px) {
  .popular-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
