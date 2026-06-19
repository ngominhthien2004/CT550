<template>
  <div class="top-bar">
    <div class="top-bar-left">
      <button type="button" class="tb-btn home-btn" @click="goHome" title="Back to Home">
        <i class="fa-solid fa-house" />
      </button>
      <button type="button" class="tb-btn" @click="store.toggleToolbar" title="Toggle toolbar">
        <i class="fa-solid fa-bars" />
      </button>
      <button type="button" class="tb-btn" @click="store.requestNewCanvas" title="New drawing (clear canvas)">
        <i class="fa-solid fa-file-circle-plus" />
      </button>
      <button type="button" class="tb-btn" @click="showShortcuts = true" title="Keyboard shortcuts (?)">
        <i class="fa-solid fa-circle-question" />
      </button>
      <span class="top-bar-title">Vẽ Tranh</span>
    </div>
    <div class="top-bar-center">
      <button type="button"
        class="tb-btn tool-btn"
        :class="{ active: store.tool === 'brush' }"
        @click="store.setTool('brush')"
        title="Brush (B)"
      >
        <i class="fa-solid fa-pen" />
        <span class="tb-label">Brush</span>
      </button>
      <button type="button"
        class="tb-btn tool-btn"
        :class="{ active: store.tool === 'eraser' }"
        @click="store.setTool('eraser')"
        title="Eraser (E)"
      >
        <i class="fa-solid fa-eraser" />
        <span class="tb-label">Eraser</span>
      </button>
      <button type="button"
        class="tb-btn tool-btn"
        :class="{ active: store.isPanning }"
        @click="store.togglePanMode"
        title="Pan (Space)"
      >
        <i class="fa-solid fa-hand" />
        <span class="tb-label">Pan</span>
      </button>
      <button type="button"
        class="tb-btn tool-btn"
        :class="{ active: store.tool === 'eyedropper' }"
        @click="store.setTool('eyedropper')"
        title="Eyedropper (I)"
      >
        <i class="fa-solid fa-eye-dropper" />
        <span class="tb-label">Pick</span>
      </button>
      <div class="tb-separator" />
      <button type="button" class="tb-btn" @click="store.undo" title="Undo (Ctrl+Z)">
        <i class="fa-solid fa-rotate-left" />
      </button>
      <button type="button" class="tb-btn" @click="store.redo" title="Redo (Ctrl+Shift+Z)">
        <i class="fa-solid fa-rotate-right" />
      </button>
    </div>
    <div class="top-bar-right">
      <button type="button" class="tb-btn" @click="store.triggerImport" title="Import image">
        <i class="fa-solid fa-image" />
      </button>
      <button type="button" class="tb-btn" @click="store.exportPNG" title="Export PNG">
        <i class="fa-solid fa-download" /> PNG
      </button>
      <button type="button" class="tb-btn" @click="store.exportJPG" title="Export JPG">
        <i class="fa-solid fa-download" /> JPG
      </button>
      <div class="tb-separator" />
      <button type="button" class="tb-btn save-btn" @click="store.saveCurrentDrawing" title="Save to slot">
        <i class="fa-solid fa-floppy-disk" />
      </button>
      <button type="button" class="tb-btn" @click="store.openSlotsDialog" title="Saved slots">
        <i class="fa-solid fa-folder-open" />
      </button>
      <button type="button" class="tb-btn post-btn" @click="store.openPostDialog" title="Post drawing">
        <i class="fa-solid fa-upload" />
      </button>
      <div class="tb-separator" />
      <button type="button" class="tb-btn" @click="store.fitToScreen" title="Fit to screen (0)">
        <i class="fa-solid fa-expand" />
      </button>
      <span class="zoom-label">{{ Math.round(store.stageScale * 100) }}%</span>
    </div>
  </div>
  <ShortcutsModal :visible="showShortcuts" @close="showShortcuts = false" />

  <!-- New Canvas Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showNewCanvasConfirm" class="confirm-overlay" @click.self="store.showNewCanvasConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>New Drawing</h3>
          <button type="button" class="confirm-close-btn" @click="store.showNewCanvasConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>Start a new drawing? Current drawing will be lost.</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showNewCanvasConfirm = false">Cancel</button>
          <button type="button" class="confirm-btn danger" @click="store.executeNewCanvas">Start New</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Restore Autosave Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showRestoreAutosaveConfirm" class="confirm-overlay" @click.self="store.showRestoreAutosaveConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Autosave Found</h3>
          <button type="button" class="confirm-close-btn" @click="store.showRestoreAutosaveConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>You have an unsaved autosave. Restore it?</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showRestoreAutosaveConfirm = false">Discard</button>
          <button type="button" class="confirm-btn danger" @click="store.executeRestoreAutosave">Restore</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Go Home Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showGoHomeConfirm" class="confirm-overlay" @click.self="store.showGoHomeConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Leave Drawing</h3>
          <button type="button" class="confirm-close-btn" @click="store.showGoHomeConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>You have unsaved drawing content. Leave anyway?</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showGoHomeConfirm = false">Cancel</button>
          <button type="button" class="confirm-btn danger" @click="confirmGoHome">Leave</button>
        </div>
      </div>
    </div>
  </Teleport>
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
  if (store.hasContent) {
    store.showGoHomeConfirm = true
  } else {
    router.push('/')
  }
}

function confirmGoHome() {
  store.confirmGoHomeIntent()
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

/* ─── Confirm Modal ──────────────────────────────────────────────── */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  background: #222226;
  border: 1px solid #333338;
  border-radius: 12px;
  width: 380px;
  max-width: 90vw;
  color: #e0e0e0;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333338;
}

.confirm-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: inherit;
}

.confirm-close-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-close-btn:hover {
  background: #33333a;
  color: #fff;
}

.confirm-body {
  padding: 20px;
  font-size: 14px;
  color: #ccc;
  line-height: 1.5;
}

.confirm-body p {
  margin: 0;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #333338;
}

.confirm-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-btn.cancel {
  background: #33333a;
  color: #aaa;
}

.confirm-btn.cancel:hover {
  background: #444;
  color: #fff;
}

.confirm-btn.danger {
  background: #dc2626;
  color: #fff;
}

.confirm-btn.danger:hover {
  background: #ef4444;
}
</style>
