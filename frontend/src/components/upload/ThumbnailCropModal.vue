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

  const deltaX = dx / frameSize
  const deltaY = dy / frameSize

  position.value = {
    x: clamp(dragStartPosition.value.x + deltaX, 0, 1),
    y: clamp(dragStartPosition.value.y + deltaY, 0, 1),
  }
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
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
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="crop-modal">
      <div
        v-if="show"
        class="crop-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Thumbnail crop"
        @click="handleBackdropClick"
      >
        <div class="crop-modal-card">
          <!-- Header -->
          <header class="crop-modal-header">
            <h2 class="crop-modal-title">Adjust Thumbnail</h2>
            <button
              type="button"
              class="crop-modal-close"
              aria-label="Close"
              @click="handleCancel"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </header>

          <!-- Body -->
          <div class="crop-modal-body">
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
          <footer class="crop-modal-footer">
            <button
              type="button"
              class="crop-btn crop-btn--reset"
              @click="handleReset"
            >
              <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
              Reset
            </button>
            <div class="crop-footer-actions">
              <button
                type="button"
                class="crop-btn crop-btn--cancel"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button
                type="button"
                class="crop-btn crop-btn--apply"
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
/* --- Backdrop --- */
.crop-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
}

/* --- Card --- */
.crop-modal-card {
  width: min(480px, 100%);
  background: var(--surface);
  border-radius: 16px;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
}

/* --- Header --- */
.crop-modal-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--line);
}

.crop-modal-title {
  font-family: 'Space Grotesk', 'Sora', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0;
}

.crop-modal-close {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  font-size: 1.1rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.crop-modal-close:hover {
  background: var(--surface-alt);
  color: var(--text);
}

/* --- Body --- */
.crop-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
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
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.08),
    var(--shadow-md);
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
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.08);
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
.crop-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
}

.crop-footer-actions {
  display: flex;
  gap: 8px;
}

/* --- Buttons --- */
.crop-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
  white-space: nowrap;
}

.crop-btn:active {
  transform: scale(0.96);
}

.crop-btn--reset {
  background: transparent;
  color: var(--muted);
  padding: 8px 12px;
}

.crop-btn--reset:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.crop-btn--cancel {
  background: var(--surface-alt);
  color: var(--text);
}

.crop-btn--cancel:hover {
  background: var(--line);
}

.crop-btn--apply {
  background: linear-gradient(135deg, #0f172a, #2563eb);
  color: #fff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.crop-btn--apply:hover {
  background: linear-gradient(135deg, #1e293b, #3b82f6);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

/* --- Transition --- */
.crop-modal-enter-active,
.crop-modal-leave-active {
  transition: opacity 0.25s ease;
}

.crop-modal-enter-active .crop-modal-card,
.crop-modal-leave-active .crop-modal-card {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.crop-modal-enter-from,
.crop-modal-leave-to {
  opacity: 0;
}

.crop-modal-enter-from .crop-modal-card,
.crop-modal-leave-to .crop-modal-card {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

/* --- Responsive --- */
@media (max-width: 640px) {
  .crop-modal-backdrop {
    padding: 12px;
    align-items: flex-end;
  }

  .crop-modal-card {
    width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }

  .crop-preview-frame {
    width: min(320px, calc(100vw - 64px));
  }

  .crop-modal-footer {
    padding: 12px 16px;
  }

  .crop-btn {
    padding: 8px 14px;
    font-size: 0.82rem;
  }
}
</style>
