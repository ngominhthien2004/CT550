<template>
  <div class="top-bar">
    <div class="top-bar-left">
      <button class="tb-btn home-btn" @click="goHome" title="Back to Home">
        <i class="fa-solid fa-house" />
      </button>
      <button class="tb-btn" @click="store.toggleToolbar" title="Toggle toolbar">
        <i class="fa-solid fa-bars" />
      </button>
      <button class="tb-btn" @click="store.newCanvas" title="New drawing (clear canvas)">
        <i class="fa-solid fa-file-circle-plus" />
      </button>
      <button class="tb-btn" @click="showShortcuts = true" title="Keyboard shortcuts (?)">
        <i class="fa-solid fa-circle-question" />
      </button>
      <span class="top-bar-title">Vẽ Tranh</span>
    </div>
    <div class="top-bar-center">
      <button
        class="tb-btn tool-btn"
        :class="{ active: store.tool === 'brush' }"
        @click="store.setTool('brush')"
        title="Brush (B)"
      >
        <i class="fa-solid fa-pen" />
        <span class="tb-label">Brush</span>
      </button>
      <button
        class="tb-btn tool-btn"
        :class="{ active: store.tool === 'eraser' }"
        @click="store.setTool('eraser')"
        title="Eraser (E)"
      >
        <i class="fa-solid fa-eraser" />
        <span class="tb-label">Eraser</span>
      </button>
      <button
        class="tb-btn tool-btn"
        :class="{ active: store.isPanning }"
        @click="store.togglePanMode"
        title="Pan (Space)"
      >
        <i class="fa-solid fa-hand" />
        <span class="tb-label">Pan</span>
      </button>
      <button
        class="tb-btn tool-btn"
        :class="{ active: store.tool === 'eyedropper' }"
        @click="store.setTool('eyedropper')"
        title="Eyedropper (I)"
      >
        <i class="fa-solid fa-eye-dropper" />
        <span class="tb-label">Pick</span>
      </button>
      <div class="tb-separator" />
      <button class="tb-btn" @click="store.undo" title="Undo (Ctrl+Z)">
        <i class="fa-solid fa-rotate-left" />
      </button>
      <button class="tb-btn" @click="store.redo" title="Redo (Ctrl+Shift+Z)">
        <i class="fa-solid fa-rotate-right" />
      </button>
    </div>
    <div class="top-bar-right">
      <button class="tb-btn" @click="store.triggerImport" title="Import image">
        <i class="fa-solid fa-image" />
      </button>
      <button class="tb-btn" @click="store.exportPNG" title="Export PNG">
        <i class="fa-solid fa-download" /> PNG
      </button>
      <button class="tb-btn" @click="store.exportJPG" title="Export JPG">
        <i class="fa-solid fa-download" /> JPG
      </button>
      <div class="tb-separator" />
      <button class="tb-btn save-btn" @click="store.saveCurrentDrawing" title="Save to slot">
        <i class="fa-solid fa-floppy-disk" />
      </button>
      <button class="tb-btn" @click="store.openSlotsDialog" title="Saved slots">
        <i class="fa-solid fa-folder-open" />
      </button>
      <button class="tb-btn post-btn" @click="store.openPostDialog" title="Post drawing">
        <i class="fa-solid fa-upload" />
      </button>
      <div class="tb-separator" />
      <button class="tb-btn" @click="store.fitToScreen" title="Fit to screen (0)">
        <i class="fa-solid fa-expand" />
      </button>
      <span class="zoom-label">{{ Math.round(store.stageScale * 100) }}%</span>
    </div>
  </div>
  <ShortcutsModal :visible="showShortcuts" @close="showShortcuts = false" />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDrawingStore } from '../../stores/drawing.store.js'
import ShortcutsModal from './ShortcutsModal.vue'

const router = useRouter()
const store = useDrawingStore()
const showShortcuts = ref(false)

function goHome() {
  router.push('/')
}
</script>

<style scoped>
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

.tb-btn.home-btn {
  color: #888;
  margin-right: 4px;
}
.tb-btn.home-btn:hover {
  color: #4a6cf7;
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

/* Responsive: hide labels on small screens */
@media (max-width: 900px) {
  .tb-label {
    display: none;
  }
}

@media (max-width: 640px) {
  .top-bar-title {
    display: none;
  }
  .top-bar-right .tb-btn span {
    display: none;
  }
}
</style>
