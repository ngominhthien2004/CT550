<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  artwork: {
    type: Object,
    required: true,
  },
  blurSize: {
    type: String,
    default: 'lg', // 'lg' for detail page, 'sm' for thumbnails
  },
  showBadgeOnly: {
    type: Boolean,
    default: false,
  },
})

const isRevealed = ref(false)
const alwaysShow = ref(false)

// Read localStorage preference on creation
const storedPreference = localStorage.getItem('r18_preference')
if (storedPreference === 'show') {
  isRevealed.value = true
}

const isR18 = computed(() => props.artwork?.ageRating === 'r-18')

function reveal() {
  if (alwaysShow.value) {
    localStorage.setItem('r18_preference', 'show')
  }
  isRevealed.value = true
}

function reBlur() {
  isRevealed.value = false
}

// Reset blur when artwork changes, unless global preference says 'show'
watch(
  () => props.artwork?._id,
  () => {
    alwaysShow.value = false
    if (localStorage.getItem('r18_preference') !== 'show') {
      isRevealed.value = false
    } else {
      isRevealed.value = true
    }
  },
)
</script>

<template>
  <!-- Not R-18: transparent pass-through -->
  <template v-if="!isR18">
    <slot />
  </template>

  <!-- R-18 with badge only (thumbnail mode) -->
  <template v-else-if="showBadgeOnly">
    <div class="r18-wrapper">
      <slot />
      <div class="r18-badge-static">
        <span>R-18</span>
      </div>
    </div>
  </template>

  <!-- R-18 with full blur overlay -->
  <template v-else>
    <div class="r18-wrapper" :class="[blurSize === 'sm' ? 'r18-wrapper-sm' : 'r18-wrapper-lg']">
      <!-- Blurred state: slot content + overlay -->
      <div v-show="!isRevealed" class="r18-blurred">
        <div class="r18-blur-content">
          <slot />
        </div>
        <div class="r18-overlay">
          <div class="r18-overlay-body" :class="{ 'r18-overlay-body-sm': blurSize === 'sm' }">
            <i class="fa-solid fa-triangle-exclamation r18-icon"></i>
            <p class="r18-message">This artwork contains adult content</p>
            <button type="button" class="r18-reveal-btn" @click.stop="reveal">Click to view</button>
            <label class="r18-remember">
              <input type="checkbox" v-model="alwaysShow" />
              <span>Always show R-18 content</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Revealed state: slot content + small corner badge -->
      <div v-show="isRevealed" class="r18-revealed">
        <slot />
        <button type="button" class="r18-corner-badge" @click.stop="reBlur" title="Re-blur R-18 content">
          <span class="r18-corner-label">R-18</span>
          <span class="r18-corner-close">&times;</span>
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.r18-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: inherit;
}

.r18-wrapper-lg {
  min-height: 200px;
}

.r18-wrapper-sm {
  min-height: 80px;
}

/* ─── Blurred content ─── */
.r18-blurred {
  position: relative;
  width: 100%;
  height: 100%;
}

.r18-blur-content {
  filter: blur(30px);
  pointer-events: none;
  user-select: none;
  transition: filter 0.3s ease;
}

/* ─── Overlay (blurred state) ─── */
.r18-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  z-index: 5;
  border-radius: inherit;
}

.r18-overlay-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  max-width: 320px;
}

.r18-overlay-body-sm {
  padding: 1rem;
  gap: 0.5rem;
  max-width: 220px;
}

.r18-icon {
  font-size: 2rem;
  color: var(--danger);
}

.r18-overlay-body-sm .r18-icon {
  font-size: 1.4rem;
}

.r18-message {
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
}

.r18-overlay-body-sm .r18-message {
  font-size: 0.82rem;
}

.r18-reveal-btn {
  display: inline-block;
  border: 2px solid #fff;
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.r18-reveal-btn:hover {
  background: var(--surface);
  color: var(--text);
}

.r18-overlay-body-sm .r18-reveal-btn {
  font-size: 0.82rem;
  padding: 0.35rem 1rem;
}

.r18-remember {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.78rem;
  cursor: pointer;
  user-select: none;
}

.r18-remember input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--danger);
  cursor: pointer;
}

.r18-overlay-body-sm .r18-remember {
  font-size: 0.7rem;
}

/* ─── Revealed state ─── */
.r18-revealed {
  position: relative;
  width: 100%;
  height: 100%;
}

/* ─── Corner badge (revealed state) ─── */
.r18-corner-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: none;
  border-radius: 4px;
  background: var(--danger);
  color: var(--surface);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
  line-height: 1.4;
}

.r18-corner-badge:hover {
  opacity: 1;
}

.r18-corner-label {
  vertical-align: middle;
}

.r18-corner-close {
  font-size: 1rem;
  line-height: 1;
  vertical-align: middle;
  margin-left: 2px;
}

/* ─── Static badge (showBadgeOnly mode) ─── */
.r18-badge-static {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  background: var(--danger);
  color: var(--surface);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  pointer-events: none;
  line-height: 1.4;
}
</style>
