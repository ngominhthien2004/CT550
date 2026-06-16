<template>
  <div class="drawing-app" @contextmenu.prevent>
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <button class="tb-btn" @click="toggleToolbar" title="Toggle toolbar">
          <i class="fa-solid fa-bars" />
        </button>
        <span class="top-bar-title">Vẽ Tranh</span>
      </div>
      <div class="top-bar-center">
        <button
          class="tb-btn tool-btn"
          :class="{ active: tool === 'brush' }"
          @click="setTool('brush')"
          title="Brush (B)"
        >
          <i class="fa-solid fa-pen" />
          <span class="tb-label">Brush</span>
        </button>
        <button
          class="tb-btn tool-btn"
          :class="{ active: tool === 'eraser' }"
          @click="setTool('eraser')"
          title="Eraser (E)"
        >
          <i class="fa-solid fa-eraser" />
          <span class="tb-label">Eraser</span>
        </button>
        <button
          class="tb-btn tool-btn"
          :class="{ active: isPanning }"
          @click="togglePanMode"
          title="Pan (Space)"
        >
          <i class="fa-solid fa-hand" />
          <span class="tb-label">Pan</span>
        </button>
        <button
          class="tb-btn tool-btn"
          :class="{ active: tool === 'eyedropper' }"
          @click="setTool('eyedropper')"
          title="Eyedropper (I)"
        >
          <i class="fa-solid fa-eye-dropper" />
          <span class="tb-label">Pick</span>
        </button>
        <div class="tb-separator" />
        <button class="tb-btn" @click="undo" title="Undo (Ctrl+Z)">
          <i class="fa-solid fa-rotate-left" />
        </button>
        <button class="tb-btn" @click="redo" title="Redo (Ctrl+Shift+Z)">
          <i class="fa-solid fa-rotate-right" />
        </button>
      </div>
      <div class="top-bar-right">
        <button class="tb-btn" @click="triggerImport" title="Import image">
          <i class="fa-solid fa-image" />
        </button>
        <button class="tb-btn" @click="exportPNG" title="Export PNG">
          <i class="fa-solid fa-download" /> PNG
        </button>
        <button class="tb-btn" @click="exportJPG" title="Export JPG">
          <i class="fa-solid fa-download" /> JPG
        </button>
        <div class="tb-separator" />
        <button class="tb-btn save-btn" @click="saveCurrentDrawing" title="Save to slot">
          <i class="fa-solid fa-floppy-disk" />
        </button>
        <button class="tb-btn" @click="openSlotsDialog" title="Saved slots">
          <i class="fa-solid fa-folder-open" />
        </button>
        <button class="tb-btn post-btn" @click="openPostDialog" title="Post drawing">
          <i class="fa-solid fa-upload" />
        </button>
        <div class="tb-separator" />
        <button class="tb-btn" @click="fitToScreen" title="Fit to screen (0)">
          <i class="fa-solid fa-expand" />
        </button>
        <span class="zoom-label">{{ Math.round(stageScale * 100) }}%</span>
      </div>
    </div>

    <!-- Main Area -->
    <div class="main-area">
      <!-- Left Toolbar -->
      <div class="left-toolbar" :class="{ collapsed: !toolbarVisible }">
        <!-- Color -->
        <div class="tool-section">
          <label class="tool-label">Color</label>
          <div class="color-palette">
            <button
              v-for="c in presetColors"
              :key="c"
              class="color-swatch"
              :style="{ backgroundColor: c, outline: c === '#ffffff' ? '1px solid #555' : '' }"
              :class="{ active: brushColor === c }"
              @click="brushColor = c"
            />
          </div>
          <div class="custom-color-row">
            <input
              type="color"
              v-model="brushColor"
              class="color-input"
              title="Custom color"
            />
            <span class="color-hex">{{ brushColor }}</span>
          </div>
        </div>

        <!-- Brush Size -->
        <div class="tool-section">
          <label class="tool-label">
            Size
            <span class="tool-value">{{ tool === 'eraser' ? eraserSize : brushSize }}px</span>
          </label>
          <input
            type="range"
            class="size-slider"
            :min="1"
            :max="100"
            :value="tool === 'eraser' ? eraserSize : brushSize"
            @input="onSizeChange"
          />
        </div>

        <!-- Opacity (only for brush) -->
        <div v-if="tool === 'brush'" class="tool-section">
          <label class="tool-label">
            Opacity
            <span class="tool-value">{{ Math.round(brushOpacity * 100) }}%</span>
          </label>
          <input
            type="range"
            class="size-slider"
            min="0"
            max="1"
            step="0.01"
            v-model.number="brushOpacity"
          />
        </div>

        <!-- Stroke preview -->
        <div class="tool-section stroke-preview-section">
          <div
            class="stroke-preview"
            :style="{
              width: (tool === 'eraser' ? eraserSize : brushSize) + 'px',
              height: (tool === 'eraser' ? eraserSize : brushSize) + 'px',
              backgroundColor: tool === 'eraser' ? '#ffffff' : brushColor,
              opacity: tool === 'eraser' ? 1 : brushOpacity,
            }"
          />
        </div>
      </div>

      <!-- Canvas Container -->
      <div
        ref="stageContainer"
        class="canvas-container"
        @wheel.prevent="handleZoom"
      >
        <v-stage
          ref="stageRef"
          :config="stageConfig"
          @mousedown="handleStageMouseDown"
          @mousemove="handleStageMouseMove"
          @mouseup="handleStageMouseUp"
          @mouseleave="handleStageMouseUp"
        >
          <!-- White background layer -->
          <v-layer :config="{ hitGraphEnabled: false }">
            <v-rect :config="bgRectConfig" />
          </v-layer>

          <!-- Drawing layer (single Konva layer for all content) -->
          <v-layer ref="drawLayerRef">
            <!-- Invisible rect to guarantee canvas export size -->
            <v-rect :config="invisibleCanvasRectConfig" />

            <!-- Render all visible layers' content in order -->
            <template v-for="layer in orderedVisibleLayers" :key="layer.id">
              <v-line
                v-for="(line, li) in layer.lines"
                :key="`${layer.id}-l-${li}`"
                :config="line"
              />
              <v-image
                v-for="(img, ii) in layer.images"
                :key="`${layer.id}-img-${ii}`"
                :config="img"
              />
            </template>
          </v-layer>
        </v-stage>

        <!-- Zoom overlay indicator -->
        <transition name="fade">
          <div v-if="zoomIndicator" class="zoom-indicator">
            {{ Math.round(stageScale * 100) }}%
          </div>
        </transition>
      </div>

      <!-- Right Layers Panel -->
      <div class="layers-panel">
        <div class="panel-header">
          <span class="panel-title">Layers</span>
          <button class="panel-add-btn" @click="addLayer" title="Add layer">
            <i class="fa-solid fa-plus" />
          </button>
        </div>

        <div class="layer-list">
          <div
            v-for="(layer, i) in layers"
            :key="layer.id"
            class="layer-item"
            :class="{ active: activeLayerIndex === i }"
            @click="activeLayerIndex = i"
          >
            <button
              class="layer-vis-btn"
              :title="layer.visible ? 'Hide layer' : 'Show layer'"
              @click.stop="toggleLayerVisibility(i)"
            >
              <i v-if="layer.visible" class="fa-solid fa-eye" />
              <i v-else class="fa-solid fa-eye-slash" />
            </button>
            <span class="layer-name">{{ layer.name }}</span>
            <button
              class="layer-del-btn"
              :disabled="layers.length <= 1"
              title="Delete layer"
              @click.stop="deleteLayer(i)"
            >
              <i class="fa-solid fa-trash-can" />
            </button>
          </div>
        </div>

        <div class="layer-actions">
          <button
            class="layer-move-btn"
            :disabled="activeLayerIndex <= 0"
            title="Move up"
            @click="moveLayer(activeLayerIndex, 1)"
          >
            <i class="fa-solid fa-chevron-up" />
          </button>
          <button
            class="layer-move-btn"
            :disabled="activeLayerIndex >= layers.length - 1"
            title="Move down"
            @click="moveLayer(activeLayerIndex, -1)"
          >
            <i class="fa-solid fa-chevron-down" />
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden file input for importing images -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      style="display: none"
      @change="handleFileImport"
    />
  </div>

  <!-- Save Slots Dialog -->
  <Teleport to="body">
    <div v-if="showSlotsDialog" class="modal-overlay" @click.self="showSlotsDialog = false">
      <div class="modal-content modal-content--wide">
        <div class="modal-header">
          <h2>Saved Drawings</h2>
          <button class="modal-close-btn" @click="showSlotsDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="savedSlots.length === 0" class="empty-state">
            <p>No saved drawings yet.</p>
          </div>
          <div v-else class="slots-grid">
            <div v-for="slot in savedSlots" :key="slot.id" class="slot-card">
              <img :src="slot.thumbnail" :alt="slot.name" class="slot-thumb" />
              <div class="slot-info">
                <span class="slot-name">{{ slot.name }}</span>
                <span class="slot-date">{{ formatDate(slot.timestamp) }}</span>
              </div>
              <div class="slot-actions">
                <button class="slot-btn load" @click="loadSlot(slot)">Load</button>
                <button class="slot-btn delete" @click="handleDeleteSlot(slot.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Post to Upload Dialog -->
  <Teleport to="body">
    <div v-if="showPostDialog" class="modal-overlay" @click.self="showPostDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Post Drawing</h2>
          <button class="modal-close-btn" @click="showPostDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="postPreviewUrl" class="post-preview">
            <img :src="postPreviewUrl" alt="Drawing preview" />
          </div>
          <div class="form-group">
            <label>Title *</label>
            <input v-model="postTitle" type="text" placeholder="Enter title" class="form-input" maxlength="100" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <select v-model="postType" class="form-select">
                <option value="illust">Illustration</option>
                <option value="manga">Manga</option>
                <option value="novel">Novel</option>
              </select>
            </div>
            <div class="form-group">
              <label>Age Rating</label>
              <select v-model="postAgeRating" class="form-select">
                <option value="all-ages">All Ages</option>
                <option value="r-18">R-18</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Tags (comma-separated)</label>
            <input v-model="postTags" type="text" placeholder="e.g. fanart, original character" class="form-input" />
          </div>
          <p v-if="postError" class="form-error">{{ postError }}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showPostDialog = false">Cancel</button>
          <button class="modal-btn submit" :disabled="postSubmitting" @click="submitPost">
            {{ postSubmitting ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { createArtwork } from '../services/api.js'
import { Stage as VStage, Layer as VLayer, Line as VLine, Rect as VRect, Image as VImage } from 'vue-konva'

// ─── Constants ────────────────────────────────────────────────────────
const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080
const MIN_SCALE = 0.1
const MAX_SCALE = 5.0
const ZOOM_FACTOR = 0.1
const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#0000ff', '#00ff00',
  '#ffff00', '#ff8c00', '#800080', '#ff69b4', '#8b4513',
  '#808080', '#00ffff',
]
const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg' }

// ─── Reactive State ───────────────────────────────────────────────────
const stageContainer = ref(null)
const stageRef = ref(null)
const drawLayerRef = ref(null)
const fileInput = ref(null)

const containerWidth = ref(0)
const containerHeight = ref(0)
const toolbarVisible = ref(true)
const zoomIndicator = ref(false)
let zoomIndicatorTimer = null

const stageScale = ref(1)
const stageX = ref(0)
const stageY = ref(0)

const tool = ref('brush')       // 'brush' | 'eraser' | 'eyedropper'
const brushColor = ref('#000000')
const brushSize = ref(5)
const brushOpacity = ref(1)
const eraserSize = ref(20)

const isPanning = ref(false)
const isDrawing = ref(false)
const isSpaceDown = ref(false)
let dragStartPointer = null
let dragStartStagePos = null

let nextLayerId = 2
const activeLayerIndex = ref(0)
const layers = reactive([
  { id: 1, name: 'Layer 1', visible: true, lines: [], images: [] },
])

// History mapping: { [layerId]: [lineConfigs] }
const undoMap = reactive({})
const redoMap = reactive({})

// ─── Computed ─────────────────────────────────────────────────────────
const activeLayer = computed(() => layers[activeLayerIndex.value])

const orderedVisibleLayers = computed(() =>
  layers.filter((l) => l.visible).slice().reverse()
)

const presetColors = computed(() => PRESET_COLORS)

const stageConfig = computed(() => ({
  width: containerWidth.value,
  height: containerHeight.value,
  scaleX: stageScale.value,
  scaleY: stageScale.value,
  x: stageX.value,
  y: stageY.value,
}))

const bgRectConfig = computed(() => ({
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  fill: '#ffffff',
}))

const invisibleCanvasRectConfig = {
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  fill: 'transparent',
  listening: false,
}

// ─── Canvas Coordinate Helpers ────────────────────────────────────────
function screenToCanvas(clientX, clientY) {
  const rect = stageContainer.value.getBoundingClientRect()
  return {
    x: (clientX - rect.left - stageX.value) / stageScale.value,
    y: (clientY - rect.top - stageY.value) / stageScale.value,
  }
}

// ─── Tool Management ──────────────────────────────────────────────────
function setTool(t) {
  tool.value = t
  if (t !== 'pan') isPanning.value = false
}

function togglePanMode() {
  isPanning.value = !isPanning.value
  if (isPanning.value) tool.value = 'pan'
}

function toggleToolbar() {
  toolbarVisible.value = !toolbarVisible.value
}

function onSizeChange(e) {
  const v = Number(e.target.value)
  if (tool.value === 'eraser') eraserSize.value = v
  else brushSize.value = v
}

// ─── Drawing ──────────────────────────────────────────────────────────
function createLineConfig(pos) {
  const isEraser = tool.value === 'eraser'
  return {
    points: [pos.x, pos.y],
    stroke: isEraser ? '#ffffff' : brushColor.value,
    strokeWidth: isEraser ? eraserSize.value : brushSize.value,
    opacity: isEraser ? 1 : brushOpacity.value,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.5,
    name: isEraser ? 'eraser' : 'brush',
  }
}

function handleStageMouseDown(e) {
  const nativeEvent = e.evt

  // Middle button click → start pan
  if (nativeEvent.button === 1) {
    isPanning.value = true
    dragStartPointer = { x: nativeEvent.clientX, y: nativeEvent.clientY }
    dragStartStagePos = { x: stageX.value, y: stageY.value }
    return
  }

  // Space held or pan tool → start pan with left button
  if (isSpaceDown.value || tool.value === 'pan') {
    isPanning.value = true
    dragStartPointer = { x: nativeEvent.clientX, y: nativeEvent.clientY }
    dragStartStagePos = { x: stageX.value, y: stageY.value }
    return
  }

  // Left click
  if (nativeEvent.button === 0) {
    if (tool.value === 'eyedropper') {
      pickColor(nativeEvent)
      return
    }

    if (tool.value === 'brush' || tool.value === 'eraser') {
      isDrawing.value = true
      const pos = screenToCanvas(nativeEvent.clientX, nativeEvent.clientY)
      const lineConfig = createLineConfig(pos)
      activeLayer.value.lines.push(lineConfig)
    }
  }
}

function handleStageMouseMove(e) {
  const nativeEvent = e.evt

  if (isPanning.value && dragStartPointer) {
    stageX.value = dragStartStagePos.x + (nativeEvent.clientX - dragStartPointer.x)
    stageY.value = dragStartStagePos.y + (nativeEvent.clientY - dragStartPointer.y)
    return
  }

  if (isDrawing.value) {
    const pos = screenToCanvas(nativeEvent.clientX, nativeEvent.clientY)
    const lines = activeLayer.value.lines
    const lastLine = lines[lines.length - 1]
    if (lastLine) {
      lastLine.points = [...lastLine.points, pos.x, pos.y]
    }
  }
}

function handleStageMouseUp(_e) {
  if (isPanning.value) {
    isPanning.value = false
    dragStartPointer = null
    dragStartStagePos = null
    return
  }

  if (isDrawing.value) {
    isDrawing.value = false
    const lines = activeLayer.value.lines
    if (lines.length > 0) {
      const line = lines[lines.length - 1]
      const lid = activeLayer.value.id
      if (!undoMap[lid]) undoMap[lid] = []
      undoMap[lid].push(JSON.parse(JSON.stringify(line)))
      redoMap[lid] = []
    }
    triggerAutoSave()
  }
}

// ─── Eyedropper ───────────────────────────────────────────────────────
function pickColor(nativeEvent) {
  const pos = screenToCanvas(nativeEvent.clientX, nativeEvent.clientY)
  // Search from topmost layer to bottommost
  const ordered = [...layers].reverse()
  for (const layer of ordered) {
    if (!layer.visible) continue
    // Check images first (more likely to be clicked)
    for (const img of layer.images) {
      const { x, y, width, height } = img
      if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
        // Approximate: just pick the brush color from above. We can't easily
        // get pixel color from a canvas via Konva, so we skip images.
        continue
      }
    }
    // Check lines in reverse order (topmost drawn first)
    for (let j = layer.lines.length - 1; j >= 0; j--) {
      const line = layer.lines[j]
      if (!line.stroke || line.name === 'eraser') continue
      const pts = line.points
      for (let k = 0; k < pts.length - 1; k += 2) {
        const dx = pos.x - pts[k]
        const dy = pos.y - pts[k + 1]
        if (Math.sqrt(dx * dx + dy * dy) <= line.strokeWidth) {
          brushColor.value = line.stroke
          tool.value = 'brush'
          return
        }
      }
    }
  }
}

// ─── Undo / Redo ──────────────────────────────────────────────────────
function undo() {
  const lid = activeLayer.value.id
  const stack = undoMap[lid]
  if (!stack || stack.length === 0) return
  const lineConfig = stack.pop()
  if (!redoMap[lid]) redoMap[lid] = []
  redoMap[lid].push(lineConfig)

  const lines = activeLayer.value.lines
  for (let i = lines.length - 1; i >= 0; i--) {
    if (shallowEqual(lines[i], lineConfig)) {
      lines.splice(i, 1)
      return
    }
  }
  // Fallback: remove last line
  lines.pop()
}

function redo() {
  const lid = activeLayer.value.id
  const stack = redoMap[lid]
  if (!stack || stack.length === 0) return
  const lineConfig = stack.pop()
  if (!undoMap[lid]) undoMap[lid] = []
  undoMap[lid].push(lineConfig)
  activeLayer.value.lines.push(JSON.parse(JSON.stringify(lineConfig)))
}

function shallowEqual(a, b) {
  if (!a || !b) return false
  return a.stroke === b.stroke &&
    a.strokeWidth === b.strokeWidth &&
    a.points.length === b.points.length &&
    a.points[0] === b.points[0]
}

// ─── Zoom / Pan ───────────────────────────────────────────────────────
function handleZoom(e) {
  const rect = stageContainer.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const oldScale = stageScale.value
  const direction = e.deltaY < 0 ? 1 : -1
  const newScale = oldScale * (1 + direction * ZOOM_FACTOR)
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale))

  // Zoom toward mouse pointer
  const worldX = (mouseX - stageX.value) / oldScale
  const worldY = (mouseY - stageY.value) / oldScale
  stageX.value = mouseX - worldX * clamped
  stageY.value = mouseY - worldY * clamped
  stageScale.value = clamped

  // Show zoom indicator
  zoomIndicator.value = true
  clearTimeout(zoomIndicatorTimer)
  zoomIndicatorTimer = setTimeout(() => { zoomIndicator.value = false }, 800)
}

function fitToScreen() {
  const pad = 40
  const w = containerWidth.value - pad
  const h = containerHeight.value - pad
  const scale = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT)
  stageScale.value = scale
  stageX.value = (containerWidth.value - CANVAS_WIDTH * scale) / 2
  stageY.value = (containerHeight.value - CANVAS_HEIGHT * scale) / 2
}

// ─── Layers ───────────────────────────────────────────────────────────
function addLayer() {
  nextLayerId++
  layers.push({
    id: nextLayerId,
    name: `Layer ${nextLayerId}`,
    visible: true,
    lines: [],
    images: [],
  })
  activeLayerIndex.value = layers.length - 1
}

function deleteLayer(index) {
  if (layers.length <= 1) return
  const lid = layers[index].id
  delete undoMap[lid]
  delete redoMap[lid]
  layers.splice(index, 1)
  if (activeLayerIndex.value >= layers.length) {
    activeLayerIndex.value = layers.length - 1
  }
}

function toggleLayerVisibility(index) {
  layers[index].visible = !layers[index].visible
}

function moveLayer(index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= layers.length) return
  const temp = layers[index]
  layers[index] = layers[newIndex]
  layers[newIndex] = temp
  activeLayerIndex.value = newIndex
}

// ─── Import Image ─────────────────────────────────────────────────────
function triggerImport() {
  fileInput.value?.click()
}

function handleFileImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      let w = img.naturalWidth || img.width
      let h = img.naturalHeight || img.height
      if (w > CANVAS_WIDTH || h > CANVAS_HEIGHT) {
        const s = Math.min(CANVAS_WIDTH / w, CANVAS_HEIGHT / h) * 0.8
        w *= s
        h *= s
      }
      activeLayer.value.images.push({
        image: img,
        x: (CANVAS_WIDTH - w) / 2,
        y: (CANVAS_HEIGHT - h) / 2,
        width: w,
        height: h,
        src: evt.target.result,
      })
    }
    img.onerror = () => {
      console.warn('Failed to load image')
    }
    img.src = evt.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// ─── Export ────────────────────────────────────────────────────────────
async function exportPNG() {
  await exportImage('image/png')
}

async function exportJPG() {
  await exportImage('image/jpeg')
}

async function exportImage(mimeType) {
  const stage = stageRef.value.getStage()
  const drawLayer = drawLayerRef.value?.getNode()
  if (!drawLayer) return

  const offscreen = document.createElement('canvas')
  offscreen.width = CANVAS_WIDTH
  offscreen.height = CANVAS_HEIGHT
  const ctx = offscreen.getContext('2d')

  // White fill for JPG / transparent for PNG
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  // Collect all visible Konva layers in order
  const konvaLayers = stage.getLayers()
  for (const kLayer of konvaLayers) {
    if (!kLayer.isVisible()) continue
    try {
      const dataURL = kLayer.toDataURL({
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pixelRatio: 1,
      })
      const img = await loadImage(dataURL)
      ctx.drawImage(img, 0, 0)
    } catch {
      // Skip layers that can't be exported
    }
  }

  const ext = EXTENSIONS[mimeType] || 'png'
  const dataURL = offscreen.toDataURL(mimeType, mimeType === 'image/jpeg' ? 0.92 : 1)
  downloadFile(dataURL, `drawing.${ext}`)
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

function downloadFile(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ─── Keyboard Shortcuts ──────────────────────────────────────────────
function handleKeyDown(e) {
  // Ctrl+Shift+Z (Redo) must be checked before Ctrl+Z
  if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault()
    redo()
    return
  }
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    undo()
    return
  }
  if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    exportPNG()
    return
  }

  switch (e.key) {
    case 'b':
    case 'B':
      e.preventDefault()
      tool.value = 'brush'
      break
    case 'e':
    case 'E':
      e.preventDefault()
      tool.value = 'eraser'
      break
    case 'i':
    case 'I':
      e.preventDefault()
      tool.value = 'eyedropper'
      break
    case ' ':
      e.preventDefault()
      isSpaceDown.value = true
      if (tool.value !== 'pan') isPanning.value = true
      break
    case '[':
      if (tool.value === 'eraser') eraserSize.value = Math.max(1, eraserSize.value - 2)
      else brushSize.value = Math.max(1, brushSize.value - 2)
      break
    case ']':
      if (tool.value === 'eraser') eraserSize.value = Math.min(100, eraserSize.value + 2)
      else brushSize.value = Math.min(100, brushSize.value + 2)
      break
    case '+':
    case '=':
      stageScale.value = Math.min(MAX_SCALE, stageScale.value * 1.2)
      break
    case '-':
      stageScale.value = Math.max(MIN_SCALE, stageScale.value / 1.2)
      break
    case '0':
      fitToScreen()
      break
  }
}

function handleKeyUp(e) {
  if (e.key === ' ') {
    e.preventDefault()
    isSpaceDown.value = false
    if (tool.value !== 'pan') isPanning.value = false
  }
}

// ─── Resize ──────────────────────────────────────────────────────────
function handleResize() {
  if (!stageContainer.value) return
  const rect = stageContainer.value.getBoundingClientRect()
  containerWidth.value = rect.width
  containerHeight.value = rect.height
}

// ─── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  nextTick(() => {
    handleResize()
    fitToScreen()
    restoreAutosave()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  clearTimeout(zoomIndicatorTimer)
  clearTimeout(autoSaveTimer)
})

// ─── Save Slots (localStorage) ──────────────────────────────────────────
const SAVE_SLOTS_KEY = 'drawing_slots'
const AUTO_SAVE_KEY = 'drawing_autosave'
const MAX_SLOTS = 10
const MAX_THUMB_W = 320
const MAX_THUMB_H = 180
const router = useRouter()

const showSlotsDialog = ref(false)
const savedSlots = ref([])

function getSavedSlots() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY)) || []
  } catch {
    return []
  }
}

function saveSlotsToStorage(slots) {
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots))
}

function serializeLayers() {
  return layers.map(function (l) {
    return {
      id: l.id,
      name: l.name,
      visible: l.visible,
      lines: l.lines.map(function (line) {
        return JSON.parse(JSON.stringify(line))
      }),
      images: l.images.map(function (img) {
        return {
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          src: img.src || '',
        }
      }),
    }
  })
}

async function generateThumbnail() {
  var stage = stageRef.value.getStage()
  if (!stage) return ''
  var scale = Math.min(MAX_THUMB_W / CANVAS_WIDTH, MAX_THUMB_H / CANVAS_HEIGHT)
  var offscreen = document.createElement('canvas')
  offscreen.width = CANVAS_WIDTH * scale
  offscreen.height = CANVAS_HEIGHT * scale
  var ctx = offscreen.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, offscreen.width, offscreen.height)

  for (var kLayer of stage.getLayers()) {
    if (!kLayer.isVisible()) continue
    try {
      var dataURL = kLayer.toDataURL({
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pixelRatio: scale,
      })
      var img = await loadImage(dataURL)
      ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height)
    } catch (_) { /* skip */ }
  }
  return offscreen.toDataURL('image/png')
}

function formatDate(isoStr) {
  try {
    var d = new Date(isoStr)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_) {
    return isoStr
  }
}

async function saveCurrentDrawing() {
  var slots = getSavedSlots()
  var name = 'Drawing #' + (slots.length + 1)
  var id = Date.now()
  var thumbnail = await generateThumbnail()
  var layersData = serializeLayers()
  var slot = {
    id: id,
    name: name,
    timestamp: new Date().toISOString(),
    thumbnail: thumbnail,
    layers: layersData,
  }

  if (slots.length >= MAX_SLOTS) {
    slots.sort(function (a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp)
    })
    slots.shift()
  }
  slots.push(slot)
  saveSlotsToStorage(slots)
}

function openSlotsDialog() {
  savedSlots.value = getSavedSlots()
  showSlotsDialog.value = true
}

function loadSlot(slot) {
  if (confirm('Load this drawing? Current drawing will be replaced.')) {
    loadFromSlot(slot)
    showSlotsDialog.value = false
  }
}

function handleDeleteSlot(slotId) {
  if (confirm('Delete this saved drawing?')) {
    var slots = getSavedSlots()
    savedSlots.value = slots.filter(function (s) { return s.id !== slotId })
    saveSlotsToStorage(savedSlots.value)
  }
}

function loadFromSlot(slot) {
  layers.splice(0, layers.length)
  slot.layers.forEach(function (savedLayer) {
    var newLayer = {
      id: savedLayer.id,
      name: savedLayer.name,
      visible: savedLayer.visible,
      lines: savedLayer.lines.map(function (line) { return { ...line } }),
      images: [],
    }
    savedLayer.images.forEach(function (imgData) {
      if (imgData.src) {
        var img = new window.Image()
        img.crossOrigin = 'Anonymous'
        img.src = imgData.src
        newLayer.images.push({
          image: img,
          x: imgData.x,
          y: imgData.y,
          width: imgData.width,
          height: imgData.height,
          src: imgData.src,
        })
      }
    })
    layers.push(newLayer)
  })
  activeLayerIndex.value = 0
  var keys1 = Object.keys(undoMap)
  for (var i1 = 0; i1 < keys1.length; i1++) { delete undoMap[keys1[i1]] }
  var keys2 = Object.keys(redoMap)
  for (var i2 = 0; i2 < keys2.length; i2++) { delete redoMap[keys2[i2]] }
  nextTick(function () { fitToScreen() })
}

// ─── Auto-save ─────────────────────────────────────────────────────────
var autoSaveTimer = null

function triggerAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(function () {
    var data = serializeLayers()
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
  }, 2000)
}

function restoreFromData(data) {
  layers.splice(0, layers.length)
  data.forEach(function (savedLayer) {
    var newLayer = {
      id: savedLayer.id,
      name: savedLayer.name,
      visible: savedLayer.visible,
      lines: savedLayer.lines.map(function (line) { return { ...line } }),
      images: [],
    }
    savedLayer.images.forEach(function (imgData) {
      if (imgData.src) {
        var img = new window.Image()
        img.crossOrigin = 'Anonymous'
        img.src = imgData.src
        newLayer.images.push({
          image: img,
          x: imgData.x,
          y: imgData.y,
          width: imgData.width,
          height: imgData.height,
          src: imgData.src,
        })
      }
    })
    layers.push(newLayer)
  })
  activeLayerIndex.value = 0
  var keys1 = Object.keys(undoMap)
  for (var i1 = 0; i1 < keys1.length; i1++) { delete undoMap[keys1[i1]] }
  var keys2 = Object.keys(redoMap)
  for (var i2 = 0; i2 < keys2.length; i2++) { delete redoMap[keys2[i2]] }
  nextTick(function () { fitToScreen() })
}

function restoreAutosave() {
  try {
    var autosave = localStorage.getItem(AUTO_SAVE_KEY)
    if (!autosave) return
    var data = JSON.parse(autosave)
    var hasExistingContent = layers.some(function (l) {
      return l.lines.length > 0 || l.images.length > 0
    })
    if (!hasExistingContent) {
      restoreFromData(data)
    } else if (confirm('You have an unsaved autosave. Restore it?')) {
      restoreFromData(data)
    }
  } catch (_) { /* ignore */ }
}

// ─── Post to Upload ────────────────────────────────────────────────────
const showPostDialog = ref(false)
const postTitle = ref('')
const postType = ref('illust')
const postAgeRating = ref('all-ages')
const postTags = ref('')
const postSubmitting = ref(false)
const postError = ref('')
const postPreviewUrl = ref('')

async function openPostDialog() {
  postPreviewUrl.value = ''
  postTitle.value = ''
  postType.value = 'illust'
  postAgeRating.value = 'all-ages'
  postTags.value = ''
  postError.value = ''
  var blob = await exportToBlob()
  if (blob) {
    postPreviewUrl.value = URL.createObjectURL(blob)
  }
  showPostDialog.value = true
}

async function submitPost() {
  if (!postTitle.value.trim()) {
    postError.value = 'Title is required'
    return
  }
  postSubmitting.value = true
  postError.value = ''
  try {
    var blob = await exportToBlob()
    if (!blob) throw new Error('Failed to export drawing')

    var fd = new FormData()
    fd.append('images', blob, 'drawing.png')
    fd.append('title', postTitle.value.trim())
    fd.append('type', postType.value)
    fd.append('ageRating', postAgeRating.value)
    if (postTags.value.trim()) {
      fd.append('tags', postTags.value.trim())
    }

    var res = await createArtwork(fd)
    var artworkId = res.data?.artwork?._id || res.data?._id
    if (artworkId) {
      showPostDialog.value = false
      router.push('/artworks/' + artworkId)
    }
  } catch (err) {
    postError.value = err?.response?.data?.message || err.message || 'Failed to post drawing'
  } finally {
    postSubmitting.value = false
  }
}

async function exportToBlob() {
  var stage = stageRef.value.getStage()
  if (!stage) return null
  var offscreen = document.createElement('canvas')
  offscreen.width = CANVAS_WIDTH
  offscreen.height = CANVAS_HEIGHT
  var ctx = offscreen.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  for (var kLayer of stage.getLayers()) {
    if (!kLayer.isVisible()) continue
    try {
      var dataURL = kLayer.toDataURL({
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pixelRatio: 1,
      })
      var img = await loadImage(dataURL)
      ctx.drawImage(img, 0, 0)
    } catch (_) { /* skip */ }
  }
  return new Promise(function (resolve) { offscreen.toBlob(resolve, 'image/png') })
}
</script>

<style scoped>
/* ─── Reset ──────────────────────────────────────────────────────── */
.drawing-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1e;
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  user-select: none;
  overflow: hidden;
}

/* ─── Top Bar ────────────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  padding: 0 8px;
  background: #222226;
  border-bottom: 1px solid #333338;
  gap: 4px;
  z-index: 10;
}

.top-bar-left,
.top-bar-center,
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.top-bar-title {
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
  color: #ccc;
  letter-spacing: 0.3px;
}

.tb-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tb-btn:hover {
  background: #33333a;
  color: #fff;
}

.tb-btn.active {
  background: #4a6cf7;
  color: #fff;
}

.tb-btn:active {
  transform: scale(0.95);
}

.tb-label {
  font-size: 11px;
  margin-left: 2px;
}

.tb-separator {
  width: 1px;
  height: 24px;
  background: #444;
  margin: 0 6px;
}

.zoom-label {
  font-size: 12px;
  color: #888;
  min-width: 44px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* ─── Main Area ──────────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* ─── Left Toolbar ───────────────────────────────────────────────── */
.left-toolbar {
  width: 220px;
  min-width: 220px;
  background: #222226;
  border-right: 1px solid #333338;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  transition: margin-left 0.2s ease, opacity 0.2s ease;
}

.left-toolbar.collapsed {
  margin-left: -220px;
  opacity: 0;
  pointer-events: none;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-value {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 11px;
  color: #aaa;
}

/* Color Palette */
.color-palette {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.15);
  z-index: 1;
}

.color-swatch.active {
  box-shadow: 0 0 0 2px #4a6cf7;
  transform: scale(1.1);
  z-index: 1;
}

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.color-input {
  width: 32px;
  height: 32px;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  background: none;
}

.color-hex {
  font-size: 12px;
  font-family: monospace;
  color: #aaa;
}

/* Sliders */
.size-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #444;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4a6cf7;
  cursor: pointer;
  border: none;
}

.size-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4a6cf7;
  cursor: pointer;
  border: none;
}

/* Stroke Preview */
.stroke-preview-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid #333338;
  margin-top: 4px;
}

.stroke-preview {
  border-radius: 50%;
  border: 1px solid #555;
  transition: all 0.1s ease;
}

/* ─── Canvas Container ───────────────────────────────────────────── */
.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-image:
    linear-gradient(45deg, #2a2a2e 25%, transparent 25%),
    linear-gradient(-45deg, #2a2a2e 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2a2e 75%),
    linear-gradient(-45deg, transparent 75%, #2a2a2e 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #1e1e22;
}

.canvas-container :deep(canvas) {
  outline: none;
}

/* Zoom Indicator */
.zoom-indicator {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
  z-index: 5;
  font-variant-numeric: tabular-nums;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── Layers Panel ───────────────────────────────────────────────── */
.layers-panel {
  width: 200px;
  min-width: 200px;
  background: #222226;
  border-left: 1px solid #333338;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #333338;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.panel-add-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.panel-add-btn:hover {
  background: #33333a;
  color: #fff;
}

/* Layer List */
.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s ease;
  border-left: 3px solid transparent;
}

.layer-item:hover {
  background: #2a2a30;
}

.layer-item.active {
  background: #2d2d35;
  border-left-color: #4a6cf7;
}

.layer-vis-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.layer-vis-btn:hover {
  color: #fff;
}

.layer-name {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-del-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  opacity: 0;
}

.layer-item:hover .layer-del-btn {
  opacity: 1;
}

.layer-del-btn:hover:not(:disabled) {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
}

.layer-del-btn:disabled {
  cursor: not-allowed;
  opacity: 0.2;
}

/* Layer Actions (Move Up/Down) */
.layer-actions {
  display: flex;
  border-top: 1px solid #333338;
  padding: 4px;
  gap: 4px;
}

.layer-move-btn {
  flex: 1;
  height: 30px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.layer-move-btn:hover:not(:disabled) {
  background: #33333a;
  color: #fff;
}

.layer-move-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

/* ─── Scrollbar ──────────────────────────────────────────────────── */
.left-toolbar::-webkit-scrollbar,
.layer-list::-webkit-scrollbar {
  width: 4px;
}

.left-toolbar::-webkit-scrollbar-track,
.layer-list::-webkit-scrollbar-track {
  background: transparent;
}

.left-toolbar::-webkit-scrollbar-thumb,
.layer-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

/* ─── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .left-toolbar {
    width: 180px;
    min-width: 180px;
  }
  .left-toolbar.collapsed {
    margin-left: -180px;
  }
  .layers-panel {
    width: 160px;
    min-width: 160px;
  }
  .tb-label {
    display: none;
  }
}

@media (max-width: 640px) {
  .left-toolbar {
    position: fixed;
    left: 0;
    top: 48px;
    bottom: 0;
    z-index: 20;
    width: 200px;
  }
  .left-toolbar.collapsed {
    margin-left: 0;
    transform: translateX(-100%);
    opacity: 1;
    pointer-events: none;
  }
  .layers-panel {
    position: fixed;
    right: 0;
    top: 48px;
    bottom: 0;
    z-index: 20;
    width: 180px;
  }
  .top-bar-title {
    display: none;
  }
  .top-bar-right .tb-btn span {
    display: none;
  }
}

/* ─── Modals ──────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #222226;
  border: 1px solid #333338;
  border-radius: 12px;
  width: 460px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  color: #e0e0e0;
}

.modal-content--wide {
  width: 640px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333338;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #33333a;
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #333338;
}

.modal-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-btn.cancel {
  background: #33333a;
  color: #aaa;
}

.modal-btn.cancel:hover {
  background: #444;
  color: #fff;
}

.modal-btn.submit {
  background: #4a6cf7;
  color: #fff;
}

.modal-btn.submit:hover:not(:disabled) {
  background: #5b7df8;
}

.modal-btn.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Post preview */
.post-preview {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  max-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-preview img {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
}

/* Form fields */
.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 6px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1e;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #4a6cf7;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.form-error {
  color: #ff4757;
  font-size: 13px;
  margin: 8px 0 0;
}

/* Save slots grid */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.slot-card {
  background: #1a1a1e;
  border: 1px solid #333338;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.slot-card:hover {
  border-color: #4a6cf7;
}

.slot-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  background: #fff;
}

.slot-info {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-date {
  font-size: 11px;
  color: #888;
}

.slot-actions {
  display: flex;
  border-top: 1px solid #333338;
}

.slot-btn {
  flex: 1;
  padding: 6px;
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slot-btn:hover {
  background: #33333a;
}

.slot-btn.load {
  border-right: 1px solid #333338;
  color: #4a6cf7;
}

.slot-btn.delete:hover {
  color: #ff4757;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 14px;
}

/* Top bar save/post button accents */
.tb-btn.save-btn {
  color: #4ade80;
}

.tb-btn.save-btn:hover {
  color: #6ee7a0;
}

.tb-btn.post-btn {
  color: #4a6cf7;
  font-weight: 600;
}
</style>
