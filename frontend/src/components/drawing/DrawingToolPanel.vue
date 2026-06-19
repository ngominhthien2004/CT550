<template>
  <div class="left-toolbar" :class="{ collapsed: !store.toolbarVisible }">
    <!-- Color -->
    <div class="tool-section">
      <label class="tool-label">Color</label>
      <div class="color-palette">
        <button type="button"
          v-for="c in store.PRESET_COLORS"
          :key="c"
          class="color-swatch"
          :style="{ backgroundColor: c, outline: c === '#ffffff' ? '1px solid #555' : '' }"
          :class="{ active: store.brushColor === c }"
          @click="store.brushColor = c"
        />
      </div>
      <div class="custom-color-row">
        <input
          type="color"
          v-model="store.brushColor"
          class="color-input"
          title="Custom color"
        />
        <span class="color-hex">{{ store.brushColor }}</span>
      </div>
    </div>

    <!-- Brush Size -->
    <div class="tool-section">
      <label class="tool-label">
        Size
        <span class="tool-value">{{ store.tool === 'eraser' ? store.eraserSize : store.brushSize }}px</span>
      </label>
      <input
        type="range"
        class="size-slider"
        :min="1"
        :max="100"
        :value="store.tool === 'eraser' ? store.eraserSize : store.brushSize"
        @input="store.onSizeChange"
      />
    </div>

    <!-- Opacity (only for brush) -->
    <div v-if="store.tool === 'brush'" class="tool-section">
      <label class="tool-label">
        Opacity
        <span class="tool-value">{{ Math.round(store.brushOpacity * 100) }}%</span>
      </label>
      <input
        type="range"
        class="size-slider"
        min="0"
        max="1"
        step="0.01"
        v-model.number="store.brushOpacity"
      />
    </div>

    <!-- Stroke preview -->
    <div class="tool-section stroke-preview-section">
      <div
        class="stroke-preview"
        :style="{
          width: (store.tool === 'eraser' ? store.eraserSize : store.brushSize) + 'px',
          height: (store.tool === 'eraser' ? store.eraserSize : store.brushSize) + 'px',
          backgroundColor: store.tool === 'eraser' ? '#ffffff' : store.brushColor,
          opacity: store.tool === 'eraser' ? 1 : store.brushOpacity,
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { useDrawingStore } from '../../stores/drawing.store.js'

const store = useDrawingStore()
</script>

<style scoped>
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

/* Scrollbar */
.left-toolbar::-webkit-scrollbar {
  width: 4px;
}

.left-toolbar::-webkit-scrollbar-track {
  background: transparent;
}

.left-toolbar::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

/* Responsive */
@media (max-width: 900px) {
  .left-toolbar {
    width: 180px;
    min-width: 180px;
  }
  .left-toolbar.collapsed {
    margin-left: -180px;
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
}
</style>
