/**
 * useDrawingExport — Export / thumbnail generation for the drawing tool.
 * Stateless: receives stageRef + canvas constants, returns action functions.
 */
export function useDrawingExport(stageRef, CANVAS_WIDTH, CANVAS_HEIGHT, EXTENSIONS, MAX_THUMB_W, MAX_THUMB_H) {
  // ─── Internal helpers ──────────────────────────────────────────────
  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new window.Image()
      img.crossOrigin = 'Anonymous'
      img.onload = function () { resolve(img) }
      img.onerror = function () { reject(new Error('Image load failed')) }
      img.src = url
    })
  }

  function downloadFile(url, filename) {
    var link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Public API ────────────────────────────────────────────────────

  /** Export the drawing as a PNG file (download). */
  async function exportPNG() {
    await exportImage('image/png')
  }

  /** Export the drawing as a JPEG file (download). */
  async function exportJPG() {
    await exportImage('image/jpeg')
  }

  /** Render all Konva layers onto an off-screen canvas and download. */
  async function exportImage(mimeType) {
    var stage = stageRef.value ? stageRef.value.getStage() : null
    if (!stage) return

    var offscreen = document.createElement('canvas')
    offscreen.width = CANVAS_WIDTH
    offscreen.height = CANVAS_HEIGHT
    var ctx = offscreen.getContext('2d')

    // White fill for JPG
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    var konvaLayers = stage.getLayers()
    for (var ki = 0; ki < konvaLayers.length; ki++) {
      var kLayer = konvaLayers[ki]
      if (!kLayer.isVisible()) continue
      try {
        var dataURL = kLayer.toDataURL({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, pixelRatio: 1 })
        var img = await loadImage(dataURL)
        ctx.drawImage(img, 0, 0)
      } catch (_e) { /* skip */ }
    }

    var ext = EXTENSIONS[mimeType] || 'png'
    var outURL = offscreen.toDataURL(mimeType, mimeType === 'image/jpeg' ? 0.92 : 1)
    downloadFile(outURL, 'drawing.' + ext)
  }

  /** Render the drawing to a Blob (PNG). Used by the post flow. */
  async function exportToBlob() {
    var stage = stageRef.value ? stageRef.value.getStage() : null
    if (!stage) return null

    var offscreen = document.createElement('canvas')
    offscreen.width = CANVAS_WIDTH
    offscreen.height = CANVAS_HEIGHT
    var ctx = offscreen.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    var konvaLayers = stage.getLayers()
    for (var ki = 0; ki < konvaLayers.length; ki++) {
      var kLayer = konvaLayers[ki]
      if (!kLayer.isVisible()) continue
      try {
        var dataURL = kLayer.toDataURL({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, pixelRatio: 1 })
        var img = await loadImage(dataURL)
        ctx.drawImage(img, 0, 0)
      } catch (_e) { /* skip */ }
    }

    return new Promise(function (resolve) {
      offscreen.toBlob(resolve, 'image/png')
    })
  }

  /** Generate a small PNG thumbnail (dataURL) for save slots. */
  async function generateThumbnail() {
    var stage = stageRef.value ? stageRef.value.getStage() : null
    if (!stage) return ''

    var scale = Math.min(MAX_THUMB_W / CANVAS_WIDTH, MAX_THUMB_H / CANVAS_HEIGHT)
    var offscreen = document.createElement('canvas')
    offscreen.width = CANVAS_WIDTH * scale
    offscreen.height = CANVAS_HEIGHT * scale
    var ctx = offscreen.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, offscreen.width, offscreen.height)

    var konvaLayers = stage.getLayers()
    for (var ki = 0; ki < konvaLayers.length; ki++) {
      var kLayer = konvaLayers[ki]
      if (!kLayer.isVisible()) continue
      try {
        var dataURL = kLayer.toDataURL({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, pixelRatio: scale })
        var img = await loadImage(dataURL)
        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height)
      } catch (_e) { /* skip */ }
    }

    return offscreen.toDataURL('image/png')
  }

  return {
    exportPNG,
    exportJPG,
    exportImage,
    exportToBlob,
    generateThumbnail,
    loadImage,
    downloadFile,
  }
}
