<template>
  <Teleport to="body">
    <div v-if="visible" class="shortcuts-overlay" @click.self="$emit('close')">
      <div class="shortcuts-modal">
        <div class="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="shortcuts-close-btn" @click="$emit('close')">&times;</button>
        </div>
        <div class="shortcuts-body">
          <div class="shortcut-group">
            <h3>Tools</h3>
            <div class="shortcut-row"><kbd>B</kbd><span>Brush</span></div>
            <div class="shortcut-row"><kbd>E</kbd><span>Eraser</span></div>
            <div class="shortcut-row"><kbd>I</kbd><span>Eyedropper</span></div>
            <div class="shortcut-row"><kbd>Space</kbd><span>Pan (hold)</span></div>
          </div>
          <div class="shortcut-group">
            <h3>Brush / Eraser</h3>
            <div class="shortcut-row"><kbd>[</kbd><span>Decrease size</span></div>
            <div class="shortcut-row"><kbd>]</kbd><span>Increase size</span></div>
          </div>
          <div class="shortcut-group">
            <h3>Edit</h3>
            <div class="shortcut-row"><kbd>Ctrl+Z</kbd><span>Undo</span></div>
            <div class="shortcut-row"><kbd>Ctrl+Shift+Z</kbd><span>Redo</span></div>
            <div class="shortcut-row"><kbd>Ctrl+S</kbd><span>Export PNG</span></div>
          </div>
          <div class="shortcut-group">
            <h3>View</h3>
            <div class="shortcut-row"><kbd>Scroll</kbd><span>Zoom</span></div>
            <div class="shortcut-row"><kbd>+ / -</kbd><span>Zoom in / out</span></div>
            <div class="shortcut-row"><kbd>0</kbd><span>Fit to screen</span></div>
            <div class="shortcut-row"><kbd>Middle click</kbd><span>Pan</span></div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ visible: Boolean })
defineEmits(['close'])
</script>

<style scoped>
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.shortcuts-modal {
  background: #222226;
  border: 1px solid #333338;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  color: #e0e0e0;
}
.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333338;
}
.shortcuts-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.shortcuts-close-btn {
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
.shortcuts-close-btn:hover {
  background: #33333a;
  color: #fff;
}
.shortcuts-body {
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.shortcut-group h3 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin: 0 0 10px;
}
.shortcut-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  font-size: 13px;
}
.shortcut-row kbd {
  display: inline-block;
  padding: 3px 8px;
  background: #1a1a1e;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: #ccc;
  min-width: 60px;
  text-align: center;
}
.shortcut-row span {
  color: #bbb;
}
</style>
