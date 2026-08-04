<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
  imageAlt: { type: String, default: '' },
  initialPosition: { type: Object, default: () => ({ x: 0.5, y: 0.5 }) },
})

const emit = defineEmits(['update:position', 'close'])

const position = ref({ x: 0.5, y: 0.5 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragStartPosition = ref({ x: 0.5, y: 0.5 })
const previewRef = ref(null)
const previewImgRef = ref(null)

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      position.value = { ...props.initialPosition }
    }
  },
)

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getEventPosition(e) {
  if (e.touches && e.touches.length > 0) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
  }
  return { clientX: e.clientX, clientY: e.clientY }
}

function onDragStart(e) {
  if (!props.show) return
  e.preventDefault()
  isDragging.value = true
  const pos = getEventPosition(e)
  dragStart.value = { x: pos.clientX, y: pos.clientY }
  dragStartPosition.value = { ...position.value }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

function onDragMove(e) {
  if (!isDragging.value) return
  e.preventDefault()
  const pos = getEventPosition(e)
  const dx = pos.clientX - dragStart.value.x
  const dy = pos.clientY - dragStart.value.y

  if (!previewRef.value) return
  const rect = previewRef.value.getBoundingClientRect()
  const frameSize = Math.min(rect.width, rect.height)
  if (frameSize === 0) return

  // Calculate actual overflow: with object-fit: cover, the image is larger than the frame
  // objectPosition % maps to overflow pixels, not frame pixels
  let overflowX = frameSize
  let overflowY = frameSize
  if (previewImgRef.value) {
    const imgW = previewImgRef.value.naturalWidth
    const imgH = previewImgRef.value.naturalHeight
    if (imgW > 0 && imgH > 0) {
      const scale = Math.max(frameSize / imgW, frameSize / imgH)
      overflowX = Math.max(0, imgW * scale - frameSize)
      overflowY = Math.max(0, imgH * scale - frameSize)
    }
  }

  const deltaX = overflowX > 0 ? dx / overflowX : 0
  const deltaY = overflowY > 0 ? dy / overflowY : 0

  position.value = {
    x: clamp(dragStartPosition.value.x + deltaX, 0, 1),
    y: clamp(dragStartPosition.value.y + deltaY, 0, 1),
  }
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  emit('update:position', { ...position.value })
}

function handleReset() {
  position.value = { x: 0.5, y: 0.5 }
  emit('update:position', { ...position.value })
}

function handleApply() {
  emit('update:position', { ...position.value })
  emit('close')
}

function handleCancel() {
  emit('close')
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.show) {
    handleCancel()
  }
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
      // Cleanup drag listeners if modal closes mid-drag
      if (isDragging.value) {
        isDragging.value = false
        document.removeEventListener('mousemove', onDragMove)
        document.removeEventListener('mouseup', onDragEnd)
        document.removeEventListener('touchmove', onDragMove)
        document.removeEventListener('touchend', onDragEnd)
      }
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="crop-modal">
      <div
        v-if="show"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Thumbnail crop"
        @click="handleBackdropClick"
      >
        <div class="modal-card crop-card">
          <!-- Header -->
          <header class="modal-header">
            <h2 class="modal-title">Adjust Thumbnail</h2>
            <button
              type="button"
              class="modal-close"
              aria-label="Close"
              @click="handleCancel"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </header>

          <!-- Body -->
          <div class="modal-body crop-body">
            <!-- Main crop preview -->
            <div class="crop-preview-area">
              <div
                ref="previewRef"
                class="crop-preview-frame"
                @mousedown="onDragStart"
                @touchstart.passive="onDragStart"
              >
                <img
                  v-if="imageUrl"
                  ref="previewImgRef"
                  :src="imageUrl"
                  :alt="imageAlt"
                  class="crop-preview-image"
                  :style="{ objectPosition: `${position.x * 100}% ${position.y * 100}%` }"
                  draggable="false"
                  @dragstart.prevent
                />
                <!-- Focal point indicator -->
                <div
                  class="crop-focal-point"
                  :style="{
                    left: `${position.x * 100}%`,
                    top: `${position.y * 100}%`,
                  }"
                >
                  <div class="focal-dot"></div>
                </div>
                <!-- Grid overlay for precision -->
                <div class="crop-grid">
                  <div class="crop-grid-line vertical" style="left: 33.33%"></div>
                  <div class="crop-grid-line vertical" style="left: 66.66%"></div>
                  <div class="crop-grid-line horizontal" style="top: 33.33%"></div>
                  <div class="crop-grid-line horizontal" style="top: 66.66%"></div>
                </div>
              </div>
            </div>

            <!-- Small thumbnail preview -->
            <div class="crop-thumb-section">
              <span class="crop-thumb-label">Preview</span>
              <div class="crop-thumb-frame">
                <img
                  v-if="imageUrl"
                  :src="imageUrl"
                  :alt="imageAlt"
                  class="crop-thumb-image"
                  :style="{ objectPosition: `${position.x * 100}% ${position.y * 100}%` }"
                  draggable="false"
                />
              </div>
            </div>

            <!-- Instruction hint -->
            <p class="crop-hint">
              <i class="fa-solid fa-arrows-up-down-left-right" aria-hidden="true"></i>
              Drag the image to adjust the thumbnail focal point
            </p>
          </div>

          <!-- Footer -->
          <footer class="modal-footer crop-footer">
            <button
              type="button"
              class="action-pill action-pill--small"
              @click="handleReset"
            >
              <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
              Reset
            </button>
            <div class="crop-footer-actions">
              <button
                type="button"
                class="action-pill action-pill--small"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button
                type="button"
                class="action-pill action-pill--small action-pill--post"
                @click="handleApply"
              >
                Apply
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '../../assets/styles/modal.css';
@import '../../assets/styles/buttons.css';

/* --- Modal overrides for crop --- */
.crop-card {
  max-height: 90vh;
  width: min(480px, 100%);
}

.crop-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  padding: 20px;
}

/* --- Main crop preview --- */
.crop-preview-area {
  width: 100%;
  display: flex;
  justify-content: center;
}

.crop-preview-frame {
  position: relative;
  width: min(380px, calc(100vw - 80px));
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  background: var(--surface-alt);
  box-shadow: var(--shadow-md);
}

.crop-preview-frame:active {
  cursor: grabbing;
}

.crop-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  transition: object-position 0.08s ease-out;
}

/* --- Focal point indicator --- */
.crop-focal-point {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}

.focal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.crop-preview-frame:active .focal-dot {
  transform: scale(1.3);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.6),
    0 2px 12px rgba(0, 0, 0, 0.4);
}

/* --- Grid overlay --- */
.crop-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.crop-grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
}

.crop-grid-line.vertical {
  width: 1px;
  top: 0;
  bottom: 0;
}

.crop-grid-line.horizontal {
  height: 1px;
  left: 0;
  right: 0;
}

/* --- Small thumbnail preview --- */
.crop-thumb-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.crop-thumb-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.crop-thumb-frame {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-alt);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.crop-thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

/* --- Hint --- */
.crop-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
  text-align: center;
}

.crop-hint i {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* --- Footer --- */
.crop-footer {
  flex-direction: row;
  justify-content: space-between;
  padding: 14px 20px;
}

.crop-footer-actions {
  display: flex;
  gap: 8px;
}

/* --- Transition --- */
.crop-modal-enter-active,
.crop-modal-leave-active {
  transition: opacity 0.25s ease;
}

.crop-modal-enter-active .modal-card,
.crop-modal-leave-active .modal-card {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.crop-modal-enter-from,
.crop-modal-leave-to {
  opacity: 0;
}

.crop-modal-enter-from .modal-card,
.crop-modal-leave-to .modal-card {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

/* --- Responsive --- */
@media (max-width: 640px) {
  .crop-card {
    width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }

  .crop-preview-frame {
    width: min(320px, calc(100vw - 64px));
  }

  .crop-footer {
    padding: 12px 16px;
  }
}
</style>
