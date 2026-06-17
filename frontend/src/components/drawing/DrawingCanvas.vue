<template>
  <div
    ref="stageContainerEl"
    class="canvas-container"
    :style="{ cursor: canvasCursor }"
    @wheel.prevent="store.handleZoom"
  >
    <v-stage
      ref="stageRefComp"
      :config="store.stageConfig"
      @mousedown="store.handleStageMouseDown"
      @mousemove="store.handleStageMouseMove"
      @mouseup="store.handleStageMouseUp"
      @mouseleave="store.handleStageMouseUp"
    >
      <!-- White background layer -->
      <v-layer :config="{ hitGraphEnabled: false }">
        <v-rect :config="store.bgRectConfig" />
      </v-layer>

      <!-- Drawing layer (single Konva layer for all content) -->
      <v-layer ref="drawLayerRefComp">
        <!-- Invisible rect to guarantee canvas export size -->
        <v-rect :config="store.invisibleCanvasRectConfig" />

        <!-- Render all visible layers' content in order -->
        <template v-for="layer in store.orderedVisibleLayers" :key="layer.id">
          <v-image
            v-for="(img, ii) in layer.images"
            :key="`${layer.id}-img-${ii}`"
            :config="img"
          />
          <v-line
            v-for="(line, li) in layer.lines"
            :key="`${layer.id}-l-${li}`"
            :config="line"
          />
        </template>
      </v-layer>
    </v-stage>

    <!-- Zoom overlay indicator -->
    <transition name="fade">
      <div v-if="store.zoomIndicator" class="zoom-indicator">
        {{ Math.round(store.stageScale * 100) }}%
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDrawingStore } from '../../stores/drawing.store.js'

const store = useDrawingStore()

const stageContainerEl = ref(null)
const stageRefComp = ref(null)
const drawLayerRefComp = ref(null)

const canvasCursor = computed(() => {
  if (store.isPanning || store.isSpaceDown) return 'grab'
  switch (store.tool) {
    case 'brush': return 'crosshair'
    case 'eraser': return 'crosshair'
    case 'eyedropper': return 'crosshair'
    case 'pan': return 'grab'
    default: return 'default'
  }
})

onMounted(() => {
  // Sync template refs to the store
  store.setStageContainer(stageContainerEl.value)
  store.setStageRef(stageRefComp)
  store.setDrawLayerRef(drawLayerRefComp)
})
</script>

<style scoped>
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
</style>
