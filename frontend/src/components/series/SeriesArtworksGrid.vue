<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ArtworkCard from '@/components/artwork/ArtworkCard.vue'

const props = defineProps({
  artworks: { type: Array, required: true },
  isOwner: { type: Boolean, default: false },
})

const emit = defineEmits(['add-artwork', 'reorder', 'remove-artwork'])

const { t } = useI18n()

function confirmRemoveArtwork(artwork) {
  const confirmed = window.confirm(t('series.removeFromSeriesConfirm'))
  if (confirmed) {
    emit('remove-artwork', artwork._id)
  }
}

const localArtworks = ref([...props.artworks])

watch(() => props.artworks, (val) => {
  localArtworks.value = [...val]
})

function swapArtwork(fromIndex, toIndex) {
  const arr = [...localArtworks.value]
  const temp = arr[fromIndex]
  arr[fromIndex] = arr[toIndex]
  arr[toIndex] = temp
  localArtworks.value = arr
  emit('reorder', arr.map((a) => a._id))
}

function moveUp(index) {
  if (index <= 0) return
  swapArtwork(index, index - 1)
}

function moveDown(index) {
  if (index >= localArtworks.value.length - 1) return
  swapArtwork(index, index + 1)
}

const openMenuId = ref(null)

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function handleClickOutside(e) {
  if (openMenuId.value && !e.target.closest('.card-menu-wrapper')) {
    openMenuId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<template>
  <div class="series-works-section">
    <h2 class="section-title">{{ $t('series.worksInSeries') }}</h2>
    <div v-if="localArtworks.length > 0 || isOwner" class="artworks-grid">
      <div
        v-for="(artwork, index) in localArtworks"
        :key="artwork._id"
        class="card-wrapper"
      >
        <ArtworkCard
          :item="artwork"
          hide-series-badge
        />
        <div v-if="isOwner" class="card-menu-wrapper">
          <button
            type="button"
            class="card-menu-btn"
            :aria-label="$t('series.menuOptions')"
            :title="$t('series.menuOptions')"
            @click.stop="toggleMenu(artwork._id)"
          >
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div v-if="openMenuId === artwork._id" class="dd-panel" @click.stop>
            <button
              v-if="index > 0"
              type="button"
              class="dd-item"
              @click="moveUp(index); openMenuId = null"
            >
              <span class="dd-item-icon"><i class="fa-solid fa-arrow-up"></i></span>
              {{ $t('series.reorderUp') }}
            </button>
            <button
              v-if="index < localArtworks.length - 1"
              type="button"
              class="dd-item"
              @click="moveDown(index); openMenuId = null"
            >
              <span class="dd-item-icon"><i class="fa-solid fa-arrow-down"></i></span>
              {{ $t('series.reorderDown') }}
            </button>
            <div v-if="index > 0 && index < localArtworks.length - 1" class="dd-separator"></div>
            <button
              type="button"
              class="dd-item dd-item--danger"
              @click="confirmRemoveArtwork(artwork); openMenuId = null"
            >
              <span class="dd-item-icon"><i class="fa-solid fa-xmark"></i></span>
              {{ $t('series.removeFromSeries') }}
            </button>
          </div>
        </div>
      </div>
      <button
        v-if="isOwner"
        type="button"
        class="add-work-card"
        :aria-label="$t('series.addWork')"
        @click="$emit('add-artwork')"
      >
        <span class="add-work-icon"><i class="fa-solid fa-plus"></i></span>
        <span class="add-work-label">{{ $t('series.addWork') }}</span>
      </button>
    </div>
    <div v-else class="empty-section">
      <p>{{ $t('series.noWorksInSeries') }}</p>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

<style scoped>
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 1rem;
}

.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.card-wrapper {
  position: relative;
  overflow: visible;
}

.card-menu-wrapper {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
}

.dd-panel {
  min-width: max-content;
  overflow: visible;
}

.dd-item {
  white-space: nowrap;
}

.card-menu-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease, transform 0.1s ease;
}

.card-wrapper:hover .card-menu-btn {
  opacity: 1;
}

.card-menu-btn:hover {
  background: rgba(0, 0, 0, 0.75);
  transform: scale(1.1);
}

.card-menu-btn:active {
  transform: scale(0.95);
}

.add-work-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  aspect-ratio: 1 / 1;
  border: 2px dashed var(--line);
  border-radius: 10px;
  background: var(--surface-alt);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  padding: 1rem;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.add-work-card:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--surface);
}

.add-work-icon {
  font-size: 2rem;
  line-height: 1;
}

.add-work-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.empty-section {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--surface);
  border-radius: 12px;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
