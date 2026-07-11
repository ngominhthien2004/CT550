import { defineStore } from 'pinia'
import { ref, reactive, computed, nextTick } from 'vue'
import { createArtwork } from '../services/api.js'

export const useDrawingStore = defineStore('drawing', () => {
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
  const SAVE_SLOTS_KEY = 'drawing_slots' // LocalStorage key constant (not a secret)
  const AUTO_SAVE_KEY = 'drawing_autosave' // LocalStorage key constant (not a secret)
  const MAX_SLOTS = 10
  const MAX_THUMB_W = 320
  const MAX_THUMB_H = 180

  // ─── Refs (state) ─────────────────────────────────────────────────────
  const stageRef = ref(null)
  const drawLayerRef = ref(null)
  const stageContainer = ref(null)
  const fileInput = ref(null)

  const containerWidth = ref(0)
  const containerHeight = ref(0)
  const toolbarVisible = ref(true)
  const zoomIndicator = ref(false)
  let zoomIndicatorTimer = null

  const stageScale = ref(1)
  const stageX = ref(0)
  const stageY = ref(0)

  const tool = ref('brush') // 'brush' | 'eraser' | 'eyedropper'
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

  // Save slots state
  const showSlotsDialog = ref(false)
  const savedSlots = ref([])

  // New canvas confirmation
  const showNewCanvasConfirm = ref(false)

  // Non-reactive flag to track go-home intent (avoids native confirm conflict)
  let goHomeIntentConfirmed = false

  // Go home confirmation
  const showGoHomeConfirm = ref(false)

  // Slot confirmation modals
  const showLoadSlotConfirm = ref(false)
  const showDeleteSlotConfirm = ref(false)
  const showRestoreAutosaveConfirm = ref(false)
  const pendingSlotId = ref(null)
  const pendingSlotData = ref(null)
  const pendingAutosaveData = ref(null)

  // Post dialog state
  const showPostDialog = ref(false)
  const postTitle = ref('')
  const postType = ref('illust')
  const postAgeRating = ref('all-ages')
  const postTags = ref('')
  const postSubmitting = ref(false)
  const postError = ref('')
  const postPreviewUrl = ref('')

  // Auto-save
  let autoSaveTimer = null

  // ─── Computed (getters) ──────────────────────────────────────────────
  const activeLayer = computed(() => layers[activeLayerIndex.value])

  const hasContent = computed(() =>
    layers.some(l => l.lines.length > 0 || l.images.length > 0)
  )

  const orderedVisibleLayers = computed(() =>
    layers.reduceRight(
      (visibleLayers, l) => l.visible ? visibleLayers.concat(l) : visibleLayers,
      []
    )
  )

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

  // ─── Template ref setters (for syncing from components) ─────────────
  function setStageRef(ref) { stageRef.value = ref }
  function setDrawLayerRef(ref) { drawLayerRef.value = ref }
  function setStageContainer(el) { stageContainer.value = el }
  function setFileInput(el) { fileInput.value = el }

  // ─── Canvas Coordinate Helpers ─────────────────────────────────────
  function screenToCanvas(clientX, clientY) {
    if (!stageContainer.value) return { x: 0, y: 0 }
    const rect = stageContainer.value.getBoundingClientRect()
    return {
      x: (clientX - rect.left - stageX.value) / stageScale.value,
      y: (clientY - rect.top - stageY.value) / stageScale.value,
    }
  }

  // ─── Tool Management ────────────────────────────────────────────────
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

  function requestNewCanvas() {
    showNewCanvasConfirm.value = true
  }

  function executeNewCanvas() {
    showNewCanvasConfirm.value = false
    // Clear all layers
    layers.splice(0, layers.length)
    // Reset to initial state
    layers.push({ id: 1, name: 'Layer 1', visible: true, lines: [], images: [] })
    activeLayerIndex.value = 0
    nextLayerId = 2
    // Clear undo/redo
    for (const key of Object.keys(undoMap)) delete undoMap[key]
    for (const key of Object.keys(redoMap)) delete redoMap[key]
    // Clear autosave
    localStorage.removeItem(AUTO_SAVE_KEY)
    // Reset canvas transform
    stageScale.value = 1
    stageX.value = 0
    stageY.value = 0
    // Re-fit
    nextTick(() => fitToScreen())
  }

  function requestGoHome() {
    showGoHomeConfirm.value = true
  }

  function confirmGoHomeIntent() {
    goHomeIntentConfirmed = true
    showGoHomeConfirm.value = false
  }

  function isGoHomeIntentConfirmed() {
    return goHomeIntentConfirmed
  }

  function clearGoHomeIntent() {
    goHomeIntentConfirmed = false
  }

  function onSizeChange(e) {
    const v = Number(e.target.value)
    if (tool.value === 'eraser') eraserSize.value = v
    else brushSize.value = v
  }

  // ─── Drawing ────────────────────────────────────────────────────────
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

  function handleStageMouseUp() {
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

  // ─── Eyedropper ─────────────────────────────────────────────────────
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
          // Approximate: just skip images, can't easily get pixel color
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

  // ─── Undo / Redo ────────────────────────────────────────────────────
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

  // ─── Zoom / Pan ─────────────────────────────────────────────────────
  function handleZoom(e) {
    if (!stageContainer.value) return
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

  // ─── Layers ─────────────────────────────────────────────────────────
  function addLayer() {
    layers.push({
      id: nextLayerId,
      name: `Layer ${nextLayerId}`,
      visible: true,
      lines: [],
      images: [],
    })
    nextLayerId++
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
    const removed = layers.splice(index, 1)[0]
    layers.splice(newIndex, 0, removed)
    activeLayerIndex.value = newIndex
  }

  // ─── Import Image ───────────────────────────────────────────────────
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

  // ─── Export ──────────────────────────────────────────────────────────
  async function exportPNG() {
    await exportImage('image/png')
  }

  async function exportJPG() {
    await exportImage('image/jpeg')
  }

  async function exportImage(mimeType) {
    const stage = stageRef.value?.getStage()
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

  // ─── Keyboard Shortcuts ────────────────────────────────────────────
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

  // ─── Clear timers ───────────────────────────────────────────────────
  function clearTimers() {
    clearTimeout(zoomIndicatorTimer)
    clearTimeout(autoSaveTimer)
    zoomIndicatorTimer = null
    autoSaveTimer = null
  }

  // ─── Save Slots (localStorage) ───────────────────────────────────────
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
    const stage = stageRef.value?.getStage()
    if (!stage) return ''
    const scale = Math.min(MAX_THUMB_W / CANVAS_WIDTH, MAX_THUMB_H / CANVAS_HEIGHT)
    const offscreen = document.createElement('canvas')
    offscreen.width = CANVAS_WIDTH * scale
    offscreen.height = CANVAS_HEIGHT * scale
    const ctx = offscreen.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, offscreen.width, offscreen.height)

    for (const kLayer of stage.getLayers()) {
      if (!kLayer.isVisible()) continue
      try {
        const dataURL = kLayer.toDataURL({
          x: 0,
          y: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          pixelRatio: scale,
        })
        const img = await loadImage(dataURL)
        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height)
      } catch {
        /* skip */
      }
    }
    return offscreen.toDataURL('image/png')
  }

  function formatDate(isoStr) {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  async function saveCurrentDrawing() {
    const slots = getSavedSlots()
    const name = 'Drawing #' + (slots.length + 1)
    const id = Date.now()
    const thumbnail = await generateThumbnail()
    const layersData = serializeLayers()
    const slot = {
      id,
      name,
      timestamp: new Date().toISOString(),
      thumbnail,
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

  function requestLoadSlot(slot) {
    pendingSlotData.value = slot
    showLoadSlotConfirm.value = true
  }

  function executeLoadSlot() {
    if (pendingSlotData.value) {
      loadFromSlot(pendingSlotData.value)
      showSlotsDialog.value = false
    }
    showLoadSlotConfirm.value = false
    pendingSlotData.value = null
  }

  function requestDeleteSlot(slotId) {
    pendingSlotId.value = slotId
    showDeleteSlotConfirm.value = true
  }

  function executeDeleteSlot() {
    if (pendingSlotId.value) {
      const slots = getSavedSlots()
      savedSlots.value = slots.filter(function (s) { return s.id !== pendingSlotId.value })
      saveSlotsToStorage(savedSlots.value)
    }
    showDeleteSlotConfirm.value = false
    pendingSlotId.value = null
  }

  function removeSlotFromStorage(slotId) {
    const slots = getSavedSlots()
    const filtered = slots.filter(function (s) { return s.id !== slotId })
    saveSlotsToStorage(filtered)
  }

  function loadFromSlot(slot) {
    layers.splice(0, layers.length)
    slot.layers.forEach(function (savedLayer) {
      const newLayer = {
        id: savedLayer.id,
        name: savedLayer.name,
        visible: savedLayer.visible,
        lines: savedLayer.lines.map(function (line) { return { ...line } }),
        images: [],
      }
      savedLayer.images.forEach(function (imgData) {
        if (imgData.src) {
          const img = new window.Image()
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
    const keys1 = Object.keys(undoMap)
    for (let i1 = 0; i1 < keys1.length; i1++) { delete undoMap[keys1[i1]] }
    const keys2 = Object.keys(redoMap)
    for (let i2 = 0; i2 < keys2.length; i2++) { delete redoMap[keys2[i2]] }
    nextTick(function () { fitToScreen() })
  }

  // ─── Auto-save ───────────────────────────────────────────────────────
  function triggerAutoSave() {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(function () {
      const data = serializeLayers()
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
    }, 2000)
  }

  function restoreFromData(data) {
    layers.splice(0, layers.length)
    data.forEach(function (savedLayer) {
      const newLayer = {
        id: savedLayer.id,
        name: savedLayer.name,
        visible: savedLayer.visible,
        lines: savedLayer.lines.map(function (line) { return { ...line } }),
        images: [],
      }
      savedLayer.images.forEach(function (imgData) {
        if (imgData.src) {
          const img = new window.Image()
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
    const keys1 = Object.keys(undoMap)
    for (let i1 = 0; i1 < keys1.length; i1++) { delete undoMap[keys1[i1]] }
    const keys2 = Object.keys(redoMap)
    for (let i2 = 0; i2 < keys2.length; i2++) { delete redoMap[keys2[i2]] }
    nextTick(function () { fitToScreen() })
  }

  function restoreAutosave() {
    try {
      const autosave = localStorage.getItem(AUTO_SAVE_KEY)
      if (!autosave) return
      const data = JSON.parse(autosave)
      const hasExistingContent = layers.some(function (l) {
        return l.lines.length > 0 || l.images.length > 0
      })
      if (!hasExistingContent) {
        restoreFromData(data)
      } else {
        pendingAutosaveData.value = data
        showRestoreAutosaveConfirm.value = true
      }
    } catch {
      /* ignore */
    }
  }

  function executeRestoreAutosave() {
    if (pendingAutosaveData.value) {
      restoreFromData(pendingAutosaveData.value)
    }
    showRestoreAutosaveConfirm.value = false
    pendingAutosaveData.value = null
  }

  // ─── Post to Upload ──────────────────────────────────────────────────
  async function openPostDialog() {
    postPreviewUrl.value = ''
    postTitle.value = ''
    postType.value = 'illust'
    postAgeRating.value = 'all-ages'
    postTags.value = ''
    postError.value = ''
    const blob = await exportToBlob()
    if (blob) {
      postPreviewUrl.value = URL.createObjectURL(blob)
    }
    showPostDialog.value = true
  }

  async function submitPost(router) {
    if (!postTitle.value.trim()) {
      postError.value = 'Title is required'
      return
    }
    postSubmitting.value = true
    postError.value = ''
    try {
      const blob = await exportToBlob()
      if (!blob) throw new Error('Failed to export drawing')

      const fd = new FormData()
      fd.append('images', blob, 'drawing.png')
      fd.append('title', postTitle.value.trim())
      fd.append('type', postType.value)
      fd.append('ageRating', postAgeRating.value)
      if (postTags.value.trim()) {
        fd.append('tags', postTags.value.trim())
      }

      const res = await createArtwork(fd)
      const artworkId = res.data?.artwork?._id || res.data?._id
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
    const stage = stageRef.value?.getStage()
    if (!stage) return null
    const offscreen = document.createElement('canvas')
    offscreen.width = CANVAS_WIDTH
    offscreen.height = CANVAS_HEIGHT
    const ctx = offscreen.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    for (const kLayer of stage.getLayers()) {
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
        /* skip */
      }
    }
    return new Promise(function (resolve) { offscreen.toBlob(resolve, 'image/png') })
  }

  return {
    // Constants
    CANVAS_WIDTH, CANVAS_HEIGHT, MIN_SCALE, MAX_SCALE, ZOOM_FACTOR,
    PRESET_COLORS, EXTENSIONS, SAVE_SLOTS_KEY, AUTO_SAVE_KEY, MAX_SLOTS,
    MAX_THUMB_W, MAX_THUMB_H,
    // Refs
    stageRef, drawLayerRef, stageContainer, fileInput,
    containerWidth, containerHeight, toolbarVisible, zoomIndicator,
    stageScale, stageX, stageY,
    tool, brushColor, brushSize, brushOpacity, eraserSize,
    isPanning, isDrawing, isSpaceDown,
    activeLayerIndex, layers, undoMap, redoMap,
    showSlotsDialog, savedSlots, showNewCanvasConfirm, showGoHomeConfirm,
    showLoadSlotConfirm, showDeleteSlotConfirm, showRestoreAutosaveConfirm,
    pendingSlotId, pendingSlotData, pendingAutosaveData,
    showPostDialog, postTitle, postType, postAgeRating, postTags,
    postSubmitting, postError, postPreviewUrl,
    // Computed
    activeLayer, hasContent, orderedVisibleLayers,
    stageConfig, bgRectConfig, invisibleCanvasRectConfig,
    // Template ref setters
    setStageRef, setDrawLayerRef, setStageContainer, setFileInput,
    // Functions
    screenToCanvas,
    setTool, togglePanMode, toggleToolbar, requestNewCanvas, executeNewCanvas,
    requestGoHome, confirmGoHomeIntent, isGoHomeIntentConfirmed, clearGoHomeIntent, onSizeChange,
    createLineConfig, handleStageMouseDown, handleStageMouseMove, handleStageMouseUp,
    pickColor, shallowEqual, undo, redo,
    handleZoom, fitToScreen,
    addLayer, deleteLayer, toggleLayerVisibility, moveLayer,
    triggerImport, handleFileImport,
    exportPNG, exportJPG, exportImage, loadImage, downloadFile,
    handleKeyDown, handleKeyUp,
    handleResize, clearTimers,
    getSavedSlots, saveSlotsToStorage, serializeLayers, generateThumbnail,
    saveCurrentDrawing, loadFromSlot, formatDate,
    requestLoadSlot, executeLoadSlot, requestDeleteSlot, executeDeleteSlot,
    removeSlotFromStorage, triggerAutoSave, restoreFromData,
    restoreAutosave, executeRestoreAutosave,
    openSlotsDialog,
    openPostDialog, submitPost, exportToBlob,
  }
})
