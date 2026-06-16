<template>
  <div class="drawing-app" @contextmenu.prevent>
    <DrawingTopBar />
    <div class="main-area">
      <DrawingToolPanel />
      <DrawingCanvas />
      <DrawingLayersPanel />
    </div>
    <input
      :ref="store.setFileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      style="display: none"
      @change="store.handleFileImport"
    />
    <SaveSlotsModal />
    <PostDrawingModal />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useDrawingStore } from '../stores/drawing.store.js'
import DrawingTopBar from '../components/drawing/DrawingTopBar.vue'
import DrawingToolPanel from '../components/drawing/DrawingToolPanel.vue'
import DrawingCanvas from '../components/drawing/DrawingCanvas.vue'
import DrawingLayersPanel from '../components/drawing/DrawingLayersPanel.vue'
import SaveSlotsModal from '../components/drawing/SaveSlotsModal.vue'
import PostDrawingModal from '../components/drawing/PostDrawingModal.vue'

const store = useDrawingStore()

onBeforeRouteLeave((_to, _from, next) => {
  if (store.hasContent) {
    const answer = window.confirm('You have unsaved drawing content. Leave anyway?')
    if (!answer) {
      next(false)
      return
    }
  }
  next()
})

onMounted(() => {
  window.addEventListener('resize', store.handleResize)
  window.addEventListener('keydown', store.handleKeyDown)
  window.addEventListener('keyup', store.handleKeyUp)
  // Defer fit and restore so canvas refs are ready
  setTimeout(() => {
    store.handleResize()
    store.fitToScreen()
    store.restoreAutosave()
  }, 50)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', store.handleResize)
  window.removeEventListener('keydown', store.handleKeyDown)
  window.removeEventListener('keyup', store.handleKeyUp)
  store.clearTimers()
})
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

/* ─── Main Area ──────────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
</style>
