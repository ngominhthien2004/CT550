<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { getArtworks } from '@/services/api'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'select'])

const authStore = useAuthStore()
const artworks = ref([])
const loading = ref(false)
const selected = ref(new Set(props.selectedIds))
const { t } = useI18n()

async function loadArtworks() {
  if (!authStore.user?._id) return
  loading.value = true
  try {
    const { data } = await getArtworks({ user: authStore.user._id, limit: 120 })
    artworks.value = Array.isArray(data) ? data : []
  } catch {
    artworks.value = []
  } finally {
    loading.value = false
  }
}

function toggleArtwork(artwork) {
  const next = new Set(selected.value)
  if (next.has(artwork._id)) {
    next.delete(artwork._id)
  } else {
    next.add(artwork._id)
  }
  selected.value = next
}

function isSelected(artworkId) {
  return selected.value.has(artworkId)
}

function confirmSelection() {
  const selectedArtworks = artworks.value.filter((a) => selected.value.has(a._id))
  emit('select', selectedArtworks)
}

function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  loadArtworks()
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="picker-backdrop" @click.self="emit('close')" @keydown.enter.prevent="emit('close')" @keydown.space.prevent="emit('close')" tabindex="0" role="button">
    <div class="picker-dialog" role="dialog" aria-modal="true" :aria-label="$t('dashboard.selectArtworks')">
      <!-- Header -->
      <div class="picker-header">
        <h3 class="picker-title">{{ $t('dashboard.selectArtworks') }}</h3>
        <button type="button" class="picker-close" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="picker-body">
        <!-- Loading -->
        <div v-if="loading" class="picker-loading">
          <div class="spinner"></div>
          <span>{{ $t('dashboard.loadingArtworks') }}</span>
        </div>

        <!-- Empty -->
        <div v-else-if="artworks.length === 0" class="picker-empty">
          <i class="fa-solid fa-image"></i>
          <p>{{ $t('dashboard.noArtworks') }}</p>
        </div>

        <!-- Grid -->
        <div v-else class="picker-grid">
          <button
            v-for="artwork in artworks"
            :key="artwork._id"
            type="button"
            class="picker-item"
            :class="{ 'picker-item--selected': isSelected(artwork._id) }"
            @click="toggleArtwork(artwork)"
          >
            <img
              :src="artwork.images?.[0] || artwork.thumbnailUrl || artwork.imageUrl || artwork.fileUrl"
              :alt="artwork.title"
              loading="lazy"
              class="picker-thumb"
            />
            <div class="picker-item-overlay">
              <span class="picker-check">
                <i class="fa-solid fa-check"></i>
              </span>
            </div>
            <span class="picker-item-title">{{ artwork.title }}</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="picker-footer">
        <span class="picker-count">{{ $t('dashboard.selectedCount', { count: selected.size }) }}</span>
        <div class="picker-actions">
          <button type="button" class="picker-btn picker-btn--cancel" @click="emit('close')">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            class="picker-btn picker-btn--confirm"
            :disabled="selected.size === 0"
            @click="confirmSelection"
          >
            {{ $t('dashboard.select') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 1rem;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.picker-dialog {
  background: var(--surface, #fff);
  border-radius: 16px;
  width: min(720px, 100%);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--line, #e5e7eb);
}

.picker-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--brand, #1f2937);
}

.picker-close {
  border: none;
  background: transparent;
  color: var(--muted, #6b7280);
  font-size: 1.15rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  transition: background 0.12s, color 0.12s;
}

.picker-close:hover {
  background: var(--surface-alt, #f3f4f6);
  color: var(--text, #374151);
}

/* Body */
.picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  min-height: 200px;
}

.picker-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: var(--muted, #6b7280);
  font-size: 0.88rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--line, #e5e7eb);
  border-top-color: var(--accent, #0096fa);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: var(--muted, #9ca3af);
}

.picker-empty i {
  font-size: 2.5rem;
}

.picker-empty p {
  font-size: 0.9rem;
}

/* Grid */
.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.picker-item {
  position: relative;
  border: 2px solid transparent;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-alt, #f9fafb);
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s, transform 0.15s;
  display: flex;
  flex-direction: column;
}

.picker-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.picker-item--selected {
  border-color: var(--accent, #0096fa);
}

.picker-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.picker-item-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  pointer-events: none;
}

.picker-item--selected .picker-item-overlay {
  background: rgba(0, 150, 250, 0.15);
}

.picker-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent, #0096fa);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s, transform 0.15s;
}

.picker-item--selected .picker-check {
  opacity: 1;
  transform: scale(1);
}

.picker-item-title {
  padding: 0.4rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text, #374151);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

/* Footer */
.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--line, #e5e7eb);
}

.picker-count {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted, #6b7280);
}

.picker-actions {
  display: flex;
  gap: 0.5rem;
}

.picker-btn {
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 999px;
  height: 36px;
  padding: 0 1.25rem;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
}

.picker-btn--cancel {
  border: 1px solid var(--line, #d1d5db);
  background: var(--surface, #fff);
  color: var(--text, #374151);
}

.picker-btn--cancel:hover {
  background: var(--surface-alt, #f9fafb);
}

.picker-btn--confirm {
  background: var(--accent, #0096fa);
  color: #fff;
}

.picker-btn--confirm:hover:not(:disabled) {
  background: var(--accent-hover, #2563eb);
}

.picker-btn--confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
