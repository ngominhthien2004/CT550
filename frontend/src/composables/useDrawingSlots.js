/**
 * useDrawingSlots — Save / load / auto-save slots for the drawing tool.
 *
 * @param {object}   ctx            Context object with:
 *   layers       - reactive array of app layers
 *   undoMap      - reactive undo history (layerId → entries)
 *   redoMap      - reactive redo history (layerId → entries)
 *   slotState    - reactive refs container (see below)
 *   generateThumbnail - async () => dataURL
 *   fitToScreen  - () => void
 *   SAVE_SLOTS_KEY, AUTO_SAVE_KEY, MAX_SLOTS, MAX_THUMB_W, MAX_THUMB_H
 */
import { ref, computed } from 'vue'
import { formatShortDate } from '../utils/date.js'

export function useDrawingSlots(ctx) {
  var {
    layers,
    undoMap,
    redoMap,
    generateThumbnail,
    fitToScreen,
    SAVE_SLOTS_KEY,
    AUTO_SAVE_KEY,
    MAX_SLOTS,
    MAX_THUMB_W,
    MAX_THUMB_H,
  } = ctx

  // ─── State ─────────────────────────────────────────────────────────
  var showSlotsDialog = ref(false)
  var savedSlots = ref([])
  var selectedSlotId = ref(null)
  var showLoadSlotConfirm = ref(false)
  var showDeleteSlotConfirm = ref(false)
  var showRestoreAutosaveConfirm = ref(false)
  var pendingSlotId = ref(null)
  var pendingSlotData = ref(null)
  var pendingAutosaveData = ref(null)
  var renamingSlotId = ref(null)
  var renamingSlotInput = ref('')
  var autoSaveTimer = null

  var selectedSlot = computed(function () {
    if (selectedSlotId.value === null) return null
    return savedSlots.value.find(function (s) { return s.id === selectedSlotId.value }) || null
  })

  // ─── Serialization ─────────────────────────────────────────────────
  function serializeLayers() {
    return layers.map(function (l) {
      return {
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        blendMode: l.blendMode,
        lines: l.lines.map(function (line) { return JSON.parse(JSON.stringify(line)) }),
        images: l.images.map(function (img) {
          return { x: img.x, y: img.y, width: img.width, height: img.height, src: img.src || '' }
        }),
        shapes: l.shapes.map(function (s) { return JSON.parse(JSON.stringify(s)) }),
      }
    })
  }

  function formatDate(isoStr) {
    return formatShortDate(isoStr)
  }

  // ─── localStorage CRUD ─────────────────────────────────────────────
  function getSavedSlots() {
    var data = localStorage.getItem(SAVE_SLOTS_KEY)
    if (!data) return []
    try {
      var parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (parseError) {
      console.warn('[drawing.slots] Discarded corrupt save slots JSON:', parseError?.message || parseError)
      localStorage.removeItem(SAVE_SLOTS_KEY)
      return []
    }
  }

  function saveSlotsToStorage(slots) {
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots))
  }

  // ─── Save / Load / Delete ─────────────────────────────────────────
  async function saveCurrentDrawing() {
    var slots = getSavedSlots()
    var name = 'Drawing #' + (slots.length + 1)
    var id = Date.now()
    var thumbnail = await generateThumbnail()
    var layersData = serializeLayers()
    var slot = { id: id, name: name, timestamp: new Date().toISOString(), thumbnail: thumbnail, layers: layersData }

    if (slots.length >= MAX_SLOTS) {
      slots.sort(function (a, b) { return new Date(a.timestamp) - new Date(b.timestamp) })
      slots.shift()
    }
    slots.push(slot)
    saveSlotsToStorage(slots)
  }

  function selectSlot(slotId) {
    selectedSlotId.value = selectedSlotId.value === slotId ? null : slotId
  }

  function clearSelection() {
    selectedSlotId.value = null
  }

  async function saveNewSlotFromDialog() {
    await saveCurrentDrawing()
    savedSlots.value = getSavedSlots()
  }

  async function overwriteSelectedSlot() {
    var slot = selectedSlot.value
    if (!slot) return
    var slots = getSavedSlots()
    var idx = slots.findIndex(function (s) { return s.id === slot.id })
    if (idx === -1) return
    var thumbnail = await generateThumbnail()
    var layersData = serializeLayers()
    slots[idx] = { ...slots[idx], timestamp: new Date().toISOString(), thumbnail: thumbnail, layers: layersData }
    saveSlotsToStorage(slots)
    savedSlots.value = slots
    selectedSlotId.value = null
  }

  function openSlotsDialog() {
    savedSlots.value = getSavedSlots()
    selectedSlotId.value = null
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
      var slots = getSavedSlots()
      savedSlots.value = slots.filter(function (s) { return s.id !== pendingSlotId.value })
      saveSlotsToStorage(savedSlots.value)
      selectedSlotId.value = null
    }
    showDeleteSlotConfirm.value = false
    pendingSlotId.value = null
  }

  function removeSlotFromStorage(slotId) {
    var slots = getSavedSlots()
    var filtered = slots.filter(function (s) { return s.id !== slotId })
    saveSlotsToStorage(filtered)
  }

  // ─── Rename ────────────────────────────────────────────────────────
  function startRenameSlot(slotId) {
    var slot = savedSlots.value.find(function (s) { return s.id === slotId })
    if (!slot) return
    renamingSlotId.value = slotId
    renamingSlotInput.value = slot.name
    selectedSlotId.value = null
  }

  function commitRenameSlot() {
    var id = renamingSlotId.value
    if (!id) return
    var newName = renamingSlotInput.value.trim()
    if (!newName) { renamingSlotId.value = null; return }
    var slots = getSavedSlots()
    for (var ri = 0; ri < slots.length; ri++) {
      if (slots[ri].id === id) { slots[ri].name = newName; break }
    }
    saveSlotsToStorage(slots)
    savedSlots.value = slots
    renamingSlotId.value = null
  }

  function cancelRenameSlot() {
    renamingSlotId.value = null
  }

  // ─── Load from saved data ──────────────────────────────────────────
  function loadFromSlot(slot) {
    // Save current drawing into undo map
    for (var li = 0; li < layers.length; li++) {
      var l = layers[li]
      if (!undoMap[l.id]) undoMap[l.id] = []
      for (var li2 = 0; li2 < l.lines.length; li2++) {
        undoMap[l.id].push(JSON.parse(JSON.stringify(l.lines[li2])))
      }
    }
    layers.splice(0, layers.length)
    slot.layers.forEach(function (savedLayer) {
      var newLayer = {
        id: savedLayer.id,
        name: savedLayer.name,
        visible: savedLayer.visible,
        opacity: savedLayer.opacity ?? 1,
        blendMode: savedLayer.blendMode ?? 'source-over',
        lines: savedLayer.lines.map(function (line) { return { ...line } }),
        images: [],
        shapes: savedLayer.shapes ? savedLayer.shapes.map(function (s) { return JSON.parse(JSON.stringify(s)) }) : [],
      }
      savedLayer.images.forEach(function (imgData) {
        if (imgData.src) {
          var img = new window.Image()
          img.crossOrigin = 'Anonymous'
          img.src = imgData.src
          newLayer.images.push({ image: img, x: imgData.x, y: imgData.y, width: imgData.width, height: imgData.height, src: imgData.src })
        }
      })
      layers.push(newLayer)
    })
    // Reset active layer + undo/redo
    for (var k1 in undoMap) { delete undoMap[k1] }
    for (var k2 in redoMap) { delete redoMap[k2] }
  }

  function restoreFromData(data) {
    // Same as loadFromSlot but without the slot wrapper
    for (var li = 0; li < layers.length; li++) {
      var l = layers[li]
      if (!undoMap[l.id]) undoMap[l.id] = []
      for (var li2 = 0; li2 < l.lines.length; li2++) {
        undoMap[l.id].push(JSON.parse(JSON.stringify(l.lines[li2])))
      }
    }
    layers.splice(0, layers.length)
    data.forEach(function (savedLayer) {
      var newLayer = {
        id: savedLayer.id,
        name: savedLayer.name,
        visible: savedLayer.visible,
        opacity: savedLayer.opacity ?? 1,
        blendMode: savedLayer.blendMode ?? 'source-over',
        lines: savedLayer.lines.map(function (line) { return { ...line } }),
        images: [],
        shapes: savedLayer.shapes ? savedLayer.shapes.map(function (s) { return JSON.parse(JSON.stringify(s)) }) : [],
      }
      savedLayer.images.forEach(function (imgData) {
        if (imgData.src) {
          var img = new window.Image()
          img.crossOrigin = 'Anonymous'
          img.src = imgData.src
          newLayer.images.push({ image: img, x: imgData.x, y: imgData.y, width: imgData.width, height: imgData.height, src: imgData.src })
        }
      })
      layers.push(newLayer)
    })
    for (var k1 in undoMap) { delete undoMap[k1] }
    for (var k2 in redoMap) { delete redoMap[k2] }
  }

  // ─── Auto-save ─────────────────────────────────────────────────────
  function triggerAutoSave() {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(function () {
      var data = serializeLayers()
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
    }, 2000)
  }

  function restoreAutosave() {
    try {
      var autosave = localStorage.getItem(AUTO_SAVE_KEY)
      if (!autosave) return
      var data = JSON.parse(autosave)
      var hasExistingContent = layers.some(function (l) { return l.lines.length > 0 || l.images.length > 0 })
      if (!hasExistingContent) {
        restoreFromData(data)
      } else {
        pendingAutosaveData.value = data
        showRestoreAutosaveConfirm.value = true
      }
    } catch (_e) { /* ignore */ }
  }

  function executeRestoreAutosave() {
    if (pendingAutosaveData.value) {
      restoreFromData(pendingAutosaveData.value)
    }
    showRestoreAutosaveConfirm.value = false
    pendingAutosaveData.value = null
  }

  function clearAutoSaveStorage() {
    localStorage.removeItem(AUTO_SAVE_KEY)
  }

  function clearAutoSaveTimer() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // ─── Return ────────────────────────────────────────────────────────
  return {
    // State
    showSlotsDialog,
    savedSlots,
    selectedSlotId,
    selectedSlot,
    showLoadSlotConfirm,
    showDeleteSlotConfirm,
    showRestoreAutosaveConfirm,
    pendingSlotId,
    pendingSlotData,
    pendingAutosaveData,
    renamingSlotId,
    renamingSlotInput,
    // Constants
    SAVE_SLOTS_KEY,
    AUTO_SAVE_KEY,
    // Functions
    getSavedSlots,
    saveSlotsToStorage,
    serializeLayers,
    formatDate,
    saveCurrentDrawing,
    selectSlot,
    clearSelection,
    saveNewSlotFromDialog,
    overwriteSelectedSlot,
    openSlotsDialog,
    requestLoadSlot,
    executeLoadSlot,
    requestDeleteSlot,
    executeDeleteSlot,
    removeSlotFromStorage,
    startRenameSlot,
    commitRenameSlot,
    cancelRenameSlot,
    loadFromSlot,
    triggerAutoSave,
    restoreFromData,
    restoreAutosave,
    executeRestoreAutosave,
    clearAutoSaveStorage,
    clearAutoSaveTimer,
  }
}
