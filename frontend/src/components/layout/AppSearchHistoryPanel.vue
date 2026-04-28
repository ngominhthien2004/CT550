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
  favoriteTagList,
  (value) => {
    localStorage.setItem(favoriteTagKey.value, JSON.stringify(value))
  },
  { deep: true },
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
.history-panel {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  z-index: 40;
  width: 100%;
  border: 1px solid #d6deea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  max-height: min(72vh, 620px);
  overflow: auto;
  padding: 0.35rem;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0.55rem;
  color: #334155;
}

.history-head strong {
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.history-head button {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
}

.history-empty {
  padding: 0.35rem 0.55rem 0.5rem;
  color: #64748b;
  font-size: 0.8rem;
  display: grid;
  gap: 0.15rem;
}

.history-item {
  width: 100%;
  border: none;
  background: #fff;
  border-radius: 10px;
  padding: 0.55rem 0.62rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.45rem;
  color: #334155;
  text-align: left;
  font-size: 0.86rem;
}

.history-item:hover,
.history-item:focus-visible {
  background: #f8fbff;
}

.history-item > span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item i {
  color: #94a3b8;
}

.history-remove {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.history-remove:hover {
  background: #eff6ff;
}

.history-suggestion {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 10px;
  padding: 0.5rem 0.62rem;
  display: inline-flex;
  align-items: center;
  gap: 0.46rem;
  color: #475569;
  text-align: left;
  font-size: 0.84rem;
}

.history-suggestion:hover,
.history-suggestion:focus-visible {
  background: #f8fbff;
}

.history-view-more {
  width: 100%;
  border: none;
  background: transparent;
  color: #1d4ed8;
  padding: 0.6rem 0.62rem;
  text-align: center;
  font-weight: 600;
}

.panel-block {
  border-top: 1px solid #eef2f7;
  margin-top: 0.2rem;
  padding: 0.85rem 0.55rem 0.45rem;
}

.panel-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
}

.panel-block-head strong {
  color: #334155;
  font-size: 1rem;
}

.panel-block-head button {
  border: none;
  background: transparent;
  color: #64748b;
}

.favorite-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.favorite-empty {
  margin: 0;
  color: #94a3b8;
  font-size: 0.78rem;
}

.favorite-tag {
  border: none;
  border-radius: 8px;
  color: #fff;
  min-width: 92px;
  text-align: left;
  padding: 0.46rem 0.62rem;
  display: grid;
  line-height: 1.05;
}

.favorite-tag span {
  font-weight: 700;
}

.favorite-tag small {
  opacity: 0.9;
  font-size: 0.76rem;
}

.favorite-tag:nth-child(3n + 1) {
  background: #91b866;
}

.favorite-tag:nth-child(3n + 2) {
  background: #c07a75;
}

.favorite-tag:nth-child(3n + 3) {
  background: #6fa5c7;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.popular-item {
  border: none;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  display: grid;
  padding: 0;
  text-align: left;
}

.popular-item img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.popular-item span {
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  font-size: 0.74rem;
  padding: 0.26rem 0.38rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.novel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.novel-tag {
  border: 1px solid #d7e0ea;
  background: #f8fafc;
  color: #334155;
  border-radius: 999px;
  padding: 0.3rem 0.62rem;
  font-size: 0.78rem;
}

.favorite-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(15, 23, 42, 0.42);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.favorite-modal-card {
  width: min(520px, 92vw);
  min-height: 320px;
  max-height: 78vh;
  border-radius: 22px;
  border: 1px solid #d8e1ef;
  background: #fff;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.2);
  padding: 0.85rem 1.15rem 1rem;
  position: relative;
  overflow: auto;
}

.favorite-modal-card h3 {
  margin: 0;
  text-align: center;
  font-size: 1.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0f172a;
}

.favorite-count {
  text-align: right;
  margin: 0.52rem 0 0.3rem;
  color: #64748b;
  font-size: 1.2rem;
  font-weight: 600;
}

.favorite-modal-close {
  position: absolute;
  top: 0.62rem;
  right: 0.68rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 1.6rem;
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
  color: #1f2937;
  font-size: 1.1rem;
  line-height: 1.2;
}

.favorite-modal-item p {
  margin: 0.1rem 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.favorite-modal-item button {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 1.2rem;
  padding: 0.1rem 0.24rem;
}

@media (max-width: 920px) {
  .popular-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
