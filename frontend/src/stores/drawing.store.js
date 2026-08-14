import { defineStore } from 'pinia'
import { ref, reactive, computed, nextTick } from 'vue'
import { createArtwork, getTags } from '../services/api.js'
import { useDrawingExport } from '../composables/useDrawingExport.js'
import { useDrawingSlots } from '../composables/useDrawingSlots.js'
import { useDrawingPost } from '../composables/useDrawingPost.js'

export const useDrawingStore = defineStore('drawing', () => {
  // ════════════════════════════════════════════════════════════════════
  //  CONSTANTS
  // ════════════════════════════════════════════════════════════════════
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
  const SAVE_SLOTS_KEY = 'drawing_slots'
  const AUTO_SAVE_KEY = 'drawing_autosave'
  const MAX_SLOTS = 10
  const MAX_THUMB_W = 320
  const MAX_THUMB_H = 180
  const BLEND_MODES = [
    'source-over', 'multiply', 'screen', 'overlay',
    'darken', 'lighten', 'color-dodge', 'color-burn',
    'hard-light', 'soft-light', 'difference', 'exclusion',
  ]
  const SHAPE_TOOLS = ['rect', 'circle', 'line', 'arrow']

  // ════════════════════════════════════════════════════════════════════
  //  CORE STATE REFS
  // ════════════════════════════════════════════════════════════════════
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

  const tool = ref('brush') // 'brush' | 'eraser' | 'eyedropper' | 'rect' | 'circle' | 'line' | 'arrow'
  const brushColor = ref('#000000')
  const brushSize = ref(5)
  const brushOpacity = ref(1)
  const eraserSize = ref(20)

  const isPanning = ref(false)
  const isDrawing = ref(false)
  const isSpaceDown = ref(false)
  let dragStartPointer = null
  let dragStartStagePos = null

  const shapeStartPos = ref(null)

  let nextLayerId = 2
  const activeLayerIndex = ref(0)
  const layers = reactive([
    { id: 1, name: 'Layer 1', visible: true, opacity: 1, blendMode: 'source-over', lines: [], images: [], shapes: [] },
  ])

  // History mapping: { [layerId]: [entries] }
  const undoMap = reactive({})
  const redoMap = reactive({})

  // New canvas confirmation
  const showNewCanvasConfirm = ref(false)

  // Non-reactive flag to track go-home intent
  let goHomeIntentConfirmed = false

  // Go home confirmation
  const showGoHomeConfirm = ref(false)

  // ════════════════════════════════════════════════════════════════════
  //  COMPOSABLES (export / slots / post)
  // ════════════════════════════════════════════════════════════════════
  var exportApi = useDrawingExport(stageRef, CANVAS_WIDTH, CANVAS_HEIGHT, EXTENSIONS, MAX_THUMB_W, MAX_THUMB_H)
  var { generateThumbnail } = exportApi

  var slotsApi = useDrawingSlots({
    layers: layers,
    undoMap: undoMap,
    redoMap: redoMap,
    generateThumbnail: generateThumbnail,
    fitToScreen: fitToScreen,
    SAVE_SLOTS_KEY: SAVE_SLOTS_KEY,
    AUTO_SAVE_KEY: AUTO_SAVE_KEY,
    MAX_SLOTS: MAX_SLOTS,
    MAX_THUMB_W: MAX_THUMB_W,
    MAX_THUMB_H: MAX_THUMB_H,
  })

  var postApi = useDrawingPost({
    exportToBlob: exportApi.exportToBlob,
    confirmGoHomeIntent: confirmGoHomeIntent,
    clearGoHomeIntent: clearGoHomeIntent,
    getTags: getTags,
    createArtwork: createArtwork,
  })

  // ════════════════════════════════════════════════════════════════════
  //  COMPUTED (getters)
  // ════════════════════════════════════════════════════════════════════
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
    x: 0, y: 0,
    width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
    fill: '#ffffff',
  }))

  const invisibleCanvasRectConfig = {
    x: 0, y: 0,
    width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
    fill: 'transparent',
    listening: false,
  }

  // ════════════════════════════════════════════════════════════════════
  //  TEMPLATE REF SETTERS
  // ════════════════════════════════════════════════════════════════════
  function setStageRef(ref) { stageRef.value = ref.value }
  function setDrawLayerRef(ref) { drawLayerRef.value = ref.value }
  function setStageContainer(el) { stageContainer.value = el }
  function setFileInput(el) { fileInput.value = el }

  // ════════════════════════════════════════════════════════════════════
  //  CANVAS COORDINATE HELPERS
  // ════════════════════════════════════════════════════════════════════
  function screenToCanvas(clientX, clientY) {
    // Prefer Konva's built-in transform — it always matches the stage
    if (stageRef.value && typeof stageRef.value.getPointerPosition === 'function') {
      var pos = stageRef.value.getPointerPosition()
      if (pos) return pos
    }
    // Fallback manual conversion (legacy)
    if (!stageContainer.value) return { x: 0, y: 0 }
    var rect = stageContainer.value.getBoundingClientRect()
    return {
      x: (clientX - rect.left - stageX.value) / stageScale.value,
      y: (clientY - rect.top - stageY.value) / stageScale.value,
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  TOOL MANAGEMENT
  // ════════════════════════════════════════════════════════════════════
  function setTool(t) {
    tool.value = t
    if (t !== 'pan') isPanning.value = false
    shapeStartPos.value = null
    isDrawing.value = false
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
    layers.splice(0, layers.length)
    layers.push({ id: 1, name: 'Layer 1', visible: true, opacity: 1, blendMode: 'source-over', lines: [], images: [], shapes: [] })
    activeLayerIndex.value = 0
    nextLayerId = 2
    for (const key of Object.keys(undoMap)) delete undoMap[key]
    for (const key of Object.keys(redoMap)) delete redoMap[key]
    slotsApi.clearAutoSaveStorage()
    stageScale.value = 1
    stageX.value = 0
    stageY.value = 0
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

  // ════════════════════════════════════════════════════════════════════
  //  DRAWING (mouse handlers)
  // ════════════════════════════════════════════════════════════════════
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

    // Middle button → pan
    if (nativeEvent.button === 1) {
      isPanning.value = true
      dragStartPointer = { x: nativeEvent.clientX, y: nativeEvent.clientY }
      dragStartStagePos = { x: stageX.value, y: stageY.value }
      return
    }

    // Space / pan tool
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

      if (isShapeTool(tool.value)) {
        isDrawing.value = true
        const pos = screenToCanvas(nativeEvent.clientX, nativeEvent.clientY)
        shapeStartPos.value = pos
        const shape = createShapeConfig(tool.value, pos, pos)
        if (shape) activeLayer.value.shapes.push(shape)
        return
      }

      if (tool.value === 'brush' || tool.value === 'eraser') {
        isDrawing.value = true
        const pos = screenToCanvas(nativeEvent.clientX, nativeEvent.clientY)
        if (tool.value === 'eraser') {
          const removed = removeHitShapes(pos)
          if (removed.length > 0) {
            const lid = activeLayer.value.id
            if (!undoMap[lid]) undoMap[lid] = []
            for (const shape of removed) {
              undoMap[lid].push({ type: 'shape-erase', data: shape })
            }
            redoMap[lid] = []
          }
        }
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

      // Shape drawing — update last shape
      if (shapeStartPos.value) {
        const shapes = activeLayer.value.shapes
        const newShape = createShapeConfig(tool.value, shapeStartPos.value, pos)
        if (newShape && shapes.length > 0) {
          shapes[shapes.length - 1] = newShape
        }
        return
      }

      // Brush / eraser — extend last line
      const lines = activeLayer.value.lines
      const lastLine = lines[lines.length - 1]
      if (lastLine) {
        lastLine.points = [...lastLine.points, pos.x, pos.y]
      }
      // Eraser: remove shapes while dragging
      if (tool.value === 'eraser') {
        const removed = removeHitShapes(pos)
        if (removed.length > 0) {
          const lid = activeLayer.value.id
          if (!undoMap[lid]) undoMap[lid] = []
          for (const shape of removed) {
            undoMap[lid].push({ type: 'shape-erase', data: shape })
          }
          redoMap[lid] = []
        }
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

      // Shape finalization
      if (shapeStartPos.value) {
        const shapes = activeLayer.value.shapes
        if (shapes.length > 0) {
          const shape = JSON.parse(JSON.stringify(shapes[shapes.length - 1]))
          const lid = activeLayer.value.id
          if (!undoMap[lid]) undoMap[lid] = []
          undoMap[lid].push({ type: 'shape', data: shape })
          redoMap[lid] = []
        }
        shapeStartPos.value = null
        slotsApi.triggerAutoSave()
        return
      }

      // Brush / eraser finalization
      const lines = activeLayer.value.lines
      if (lines.length > 0) {
        const line = lines[lines.length - 1]
        const lid = activeLayer.value.id
        if (!undoMap[lid]) undoMap[lid] = []
        undoMap[lid].push(JSON.parse(JSON.stringify(line)))
        redoMap[lid] = []
      }
      slotsApi.triggerAutoSave()
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  EYEDROPPER
  // ════════════════════════════════════════════════════════════════════
  function pickColor(nativeEvent) {
    const pos = screenToCanvas(nativeEvent.clientX, nativeEvent.clientY)
    const ordered = [...layers].reverse()
    for (const layer of ordered) {
      if (!layer.visible) continue
      for (const img of layer.images) continue // skip images
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

  // ════════════════════════════════════════════════════════════════════
  //  UNDO / REDO
  // ════════════════════════════════════════════════════════════════════
  function shapesEqual(a, b) {
    if (!a || !b) return false
    return a.type === b.type && a.config.stroke === b.config.stroke &&
      a.config.strokeWidth === b.config.strokeWidth &&
      a.config.x === b.config.x && a.config.y === b.config.y
  }

  function undo() {
    const lid = activeLayer.value.id
    const stack = undoMap[lid]
    if (!stack || stack.length === 0) return
    var entry = stack.pop()
    if (!redoMap[lid]) redoMap[lid] = []
    redoMap[lid].push(entry)

    if (entry && entry.type === 'shape-erase') {
      activeLayer.value.shapes.push(JSON.parse(JSON.stringify(entry.data)))
      return
    }

    if (entry && entry.type === 'shape') {
      var shapes = activeLayer.value.shapes
      for (var i = shapes.length - 1; i >= 0; i--) {
        if (shapesEqual(shapes[i], entry.data)) { shapes.splice(i, 1); return }
      }
      shapes.pop()
    } else {
      var lines = activeLayer.value.lines
      for (var j = lines.length - 1; j >= 0; j--) {
        if (shallowEqual(lines[j], entry)) { lines.splice(j, 1); return }
      }
      lines.pop()
    }
  }

  function redo() {
    const lid = activeLayer.value.id
    const stack = redoMap[lid]
    if (!stack || stack.length === 0) return
    var entry = stack.pop()
    if (!undoMap[lid]) undoMap[lid] = []
    undoMap[lid].push(entry)

    if (entry && entry.type === 'shape-erase') {
      var shapes = activeLayer.value.shapes
      for (var i = shapes.length - 1; i >= 0; i--) {
        if (shapesEqual(shapes[i], entry.data)) { shapes.splice(i, 1); return }
      }
      return
    }

    if (entry && entry.type === 'shape') {
      activeLayer.value.shapes.push(JSON.parse(JSON.stringify(entry.data)))
    } else {
      activeLayer.value.lines.push(JSON.parse(JSON.stringify(entry)))
    }
  }

  function shallowEqual(a, b) {
    if (!a || !b) return false
    return a.stroke === b.stroke && a.strokeWidth === b.strokeWidth &&
      a.points.length === b.points.length && a.points[0] === b.points[0]
  }

  // ════════════════════════════════════════════════════════════════════
  //  ZOOM / PAN
  // ════════════════════════════════════════════════════════════════════
  function handleZoom(e) {
    if (!stageContainer.value) return
    const rect = stageContainer.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const oldScale = stageScale.value
    const direction = e.deltaY < 0 ? 1 : -1
    const newScale = oldScale * (1 + direction * ZOOM_FACTOR)
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale))
    const worldX = (mouseX - stageX.value) / oldScale
    const worldY = (mouseY - stageY.value) / oldScale
    stageX.value = mouseX - worldX * clamped
    stageY.value = mouseY - worldY * clamped
    stageScale.value = clamped
    zoomIndicator.value = true
    clearTimeout(zoomIndicatorTimer)
    zoomIndicatorTimer = setTimeout(() => { zoomIndicator.value = false }, 800)
  }

  function fitToScreen() {
    const pad = Math.min(containerWidth.value, containerHeight.value) * 0.02
    const w = containerWidth.value - pad
    const h = containerHeight.value - pad
    const scale = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT)
    stageScale.value = scale
    stageX.value = (containerWidth.value - CANVAS_WIDTH * scale) / 2
    stageY.value = (containerHeight.value - CANVAS_HEIGHT * scale) / 2
  }

  // ════════════════════════════════════════════════════════════════════
  //  LAYERS
  // ════════════════════════════════════════════════════════════════════
  function addLayer() {
    layers.push({
      id: nextLayerId,
      name: `Layer ${nextLayerId}`,
      visible: true,
      opacity: 1,
      blendMode: 'source-over',
      lines: [],
      images: [],
      shapes: [],
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
    if (activeLayerIndex.value >= layers.length) { activeLayerIndex.value = layers.length - 1 }
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

  // ════════════════════════════════════════════════════════════════════
  //  LAYER PROPERTIES (Opacity / Blend Mode)
  // ════════════════════════════════════════════════════════════════════
  function setLayerOpacity(index, opacity) {
    if (layers[index]) layers[index].opacity = Math.min(1, Math.max(0, opacity))
    slotsApi.triggerAutoSave()
  }

  function setLayerBlendMode(index, mode) {
    if (layers[index] && BLEND_MODES.includes(mode)) {
      layers[index].blendMode = mode
      slotsApi.triggerAutoSave()
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  SHAPE TOOLS
  // ════════════════════════════════════════════════════════════════════
  function isShapeTool(t) {
    return SHAPE_TOOLS.includes(t)
  }

  function createShapeConfig(type, startPos, currentPos) {
    var x = Math.min(startPos.x, currentPos.x)
    var y = Math.min(startPos.y, currentPos.y)
    var w = Math.abs(currentPos.x - startPos.x)
    var h = Math.abs(currentPos.y - startPos.y)
    var base = {
      stroke: brushColor.value,
      strokeWidth: brushSize.value,
      strokeScaleEnabled: false,
      opacity: brushOpacity.value,
      lineCap: 'round',
      lineJoin: 'round',
    }
    switch (type) {
      case 'rect':
        return { type: 'rect', config: { ...base, x: x, y: y, width: w || 1, height: h || 1, fill: 'transparent' } }
      case 'circle':
        return { type: 'circle', config: { ...base, x: startPos.x, y: startPos.y, radiusX: Math.max(w / 2, 1), radiusY: Math.max(h / 2, 1), fill: 'transparent' } }
      case 'line':
        return { type: 'line', config: { ...base, points: [startPos.x, startPos.y, currentPos.x, currentPos.y] } }
      case 'arrow':
        return { type: 'arrow', config: { ...base, points: [startPos.x, startPos.y, currentPos.x, currentPos.y], pointerLength: 10, pointerWidth: 10 } }
      default:
        return null
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  ERASER — SHAPE INTERSECTION DETECTION
  // ════════════════════════════════════════════════════════════════════
  function eraserHitsRect(point, eraserR, shape) {
    var c = shape.config
    var closestX = Math.max(c.x, Math.min(point.x, c.x + c.width))
    var closestY = Math.max(c.y, Math.min(point.y, c.y + c.height))
    var dx = point.x - closestX
    var dy = point.y - closestY
    return (dx * dx + dy * dy) <= (eraserR * eraserR)
  }

  function eraserHitsEllipse(point, eraserR, shape) {
    var c = shape.config
    var dx = point.x - c.x
    var dy = point.y - c.y
    var rx = c.radiusX + eraserR
    var ry = c.radiusY + eraserR
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
  }

  function eraserHitsLine(point, eraserR, shape) {
    var pts = shape.config.points
    var ax = pts[0], ay = pts[1]
    var bx = pts[2], by = pts[3]
    var abx = bx - ax, aby = by - ay
    var apx = point.x - ax, apy = point.y - ay
    var abLenSq = abx * abx + aby * aby
    var t = abLenSq === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq))
    var closestX = ax + t * abx
    var closestY = ay + t * aby
    var dx = point.x - closestX
    var dy = point.y - closestY
    return (dx * dx + dy * dy) <= (eraserR * eraserR)
  }

  function eraserHitsShape(point, eraserR, shape) {
    switch (shape.type) {
      case 'rect': return eraserHitsRect(point, eraserR, shape)
      case 'circle': return eraserHitsEllipse(point, eraserR, shape)
      case 'line':
      case 'arrow': return eraserHitsLine(point, eraserR, shape)
      default: return false
    }
  }

  function removeHitShapes(pos) {
    var eraserR = eraserSize.value / 2
    var shapes = activeLayer.value.shapes
    var removed = []
    for (var i = shapes.length - 1; i >= 0; i--) {
      if (eraserHitsShape(pos, eraserR, shapes[i])) {
        removed.push(shapes.splice(i, 1)[0])
      }
    }
    return removed
  }

  // ════════════════════════════════════════════════════════════════════
  //  IMPORT IMAGE
  // ════════════════════════════════════════════════════════════════════
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
          w *= s; h *= s
        }
        activeLayer.value.images.push({
          image: img,
          x: (CANVAS_WIDTH - w) / 2,
          y: (CANVAS_HEIGHT - h) / 2,
          width: w, height: h,
          src: evt.target.result,
        })
      }
      img.onerror = () => { /* silent */ }
      img.src = evt.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ════════════════════════════════════════════════════════════════════
  //  KEYBOARD SHORTCUTS
  // ════════════════════════════════════════════════════════════════════
  function handleKeyDown(e) {
    const tag = e.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return

    if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); redo(); return }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return }
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); exportApi.exportPNG(); return }

    switch (e.key) {
      case 'b': case 'B': e.preventDefault(); tool.value = 'brush'; break
      case 'e': case 'E': e.preventDefault(); tool.value = 'eraser'; break
      case 'i': case 'I': e.preventDefault(); tool.value = 'eyedropper'; break
      case 'r': case 'R': e.preventDefault(); tool.value = 'rect'; break
      case 'c': case 'C': e.preventDefault(); tool.value = 'circle'; break
      case 'l': case 'L': e.preventDefault(); tool.value = 'line'; break
      case 'a': case 'A': e.preventDefault(); tool.value = 'arrow'; break
      case ' ':
        e.preventDefault(); isSpaceDown.value = true
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
      case '+': case '=': stageScale.value = Math.min(MAX_SCALE, stageScale.value * 1.2); break
      case '-': stageScale.value = Math.max(MIN_SCALE, stageScale.value / 1.2); break
      case '0': fitToScreen(); break
    }
  }

  function handleKeyUp(e) {
    if (e.key === ' ') {
      e.preventDefault()
      isSpaceDown.value = false
      if (tool.value !== 'pan') isPanning.value = false
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  RESIZE
  // ════════════════════════════════════════════════════════════════════
  function handleResize() {
    if (!stageContainer.value) return
    const rect = stageContainer.value.getBoundingClientRect()
    containerWidth.value = rect.width
    containerHeight.value = rect.height
  }

  // ════════════════════════════════════════════════════════════════════
  //  CLEAR TIMERS
  // ════════════════════════════════════════════════════════════════════
  function clearTimers() {
    clearTimeout(zoomIndicatorTimer)
    slotsApi.clearAutoSaveTimer()
    zoomIndicatorTimer = null
  }

  // ════════════════════════════════════════════════════════════════════
  //  RETURN — expose everything through the store
  // ════════════════════════════════════════════════════════════════════
  return {
    // ───── Constants ─────
    CANVAS_WIDTH, CANVAS_HEIGHT, MIN_SCALE, MAX_SCALE, ZOOM_FACTOR,
    PRESET_COLORS, EXTENSIONS, SAVE_SLOTS_KEY, AUTO_SAVE_KEY, MAX_SLOTS,
    MAX_THUMB_W, MAX_THUMB_H, BLEND_MODES, SHAPE_TOOLS,

    // ───── Core state refs ─────
    stageRef, drawLayerRef, stageContainer, fileInput,
    containerWidth, containerHeight, toolbarVisible, zoomIndicator,
    stageScale, stageX, stageY,
    tool, brushColor, brushSize, brushOpacity, eraserSize,
    isPanning, isDrawing, isSpaceDown, shapeStartPos,
    activeLayerIndex, layers, undoMap, redoMap,
    showNewCanvasConfirm, showGoHomeConfirm,

    // ───── Export composable ─────
    ...exportApi,

    // ───── Slots composable ─────
    ...slotsApi,

    // ───── Post composable ─────
    ...postApi,

    // ───── Computed ─────
    activeLayer, hasContent, orderedVisibleLayers,
    stageConfig, bgRectConfig, invisibleCanvasRectConfig,

    // ───── Template ref setters ─────
    setStageRef, setDrawLayerRef, setStageContainer, setFileInput,

    // ───── Core functions ─────
    screenToCanvas,
    setTool, togglePanMode, toggleToolbar, requestNewCanvas, executeNewCanvas,
    requestGoHome, confirmGoHomeIntent, isGoHomeIntentConfirmed, clearGoHomeIntent, onSizeChange,
    createLineConfig, handleStageMouseDown, handleStageMouseMove, handleStageMouseUp,
    pickColor, shallowEqual, undo, redo,
    setLayerOpacity, setLayerBlendMode, isShapeTool, createShapeConfig,
    handleZoom, fitToScreen,
    addLayer, deleteLayer, toggleLayerVisibility, moveLayer,
    triggerImport, handleFileImport,
    handleKeyDown, handleKeyUp,
    handleResize, clearTimers,
  }
})
