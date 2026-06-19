<template>
  <div class="layers-panel">
    <div class="panel-header">
      <span class="panel-title">Layers</span>
      <button type="button" class="panel-add-btn" @click="store.addLayer" title="Add layer">
        <i class="fa-solid fa-plus" />
      </button>
    </div>

    <div class="layer-list">
      <div
        v-for="(layer, i) in store.layers"
        :key="layer.id"
        class="layer-item"
        :class="{ active: store.activeLayerIndex === i }"
        @click="store.activeLayerIndex = i"
      >
        <button type="button"
          class="layer-vis-btn"
          :title="layer.visible ? 'Hide layer' : 'Show layer'"
          @click.stop="store.toggleLayerVisibility(i)"
        >
          <i v-if="layer.visible" class="fa-solid fa-eye" />
          <i v-else class="fa-solid fa-eye-slash" />
        </button>
        <span class="layer-name">{{ layer.name }}</span>
        <button type="button"
          class="layer-del-btn"
          :disabled="store.layers.length <= 1"
          title="Delete layer"
          @click.stop="store.deleteLayer(i)"
        >
          <i class="fa-solid fa-trash-can" />
        </button>
      </div>
    </div>

    <div class="layer-actions">
      <button type="button"
        class="layer-move-btn"
        :disabled="store.activeLayerIndex <= 0"
        title="Move up"
        @click="store.moveLayer(store.activeLayerIndex, 1)"
      >
        <i class="fa-solid fa-chevron-up" />
      </button>
      <button type="button"
        class="layer-move-btn"
        :disabled="store.activeLayerIndex >= store.layers.length - 1"
        title="Move down"
        @click="store.moveLayer(store.activeLayerIndex, -1)"
      >
        <i class="fa-solid fa-chevron-down" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDrawingStore } from '../../stores/drawing.store.js'

const store = useDrawingStore()
</script>

<style scoped>
.layers-panel {
  width: 200px;
  min-width: 200px;
  background: #222226;
  border-left: 1px solid #333338;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #333338;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.panel-add-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.panel-add-btn:hover {
  background: #33333a;
  color: #fff;
}

/* Layer List */
.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s ease;
  border-left: 3px solid transparent;
}

.layer-item:hover {
  background: #2a2a30;
}

.layer-item.active {
  background: #2d2d35;
  border-left-color: #4a6cf7;
}

.layer-vis-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.layer-vis-btn:hover {
  color: #fff;
}

.layer-name {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-del-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  opacity: 0;
}

.layer-item:hover .layer-del-btn {
  opacity: 1;
}

.layer-del-btn:hover:not(:disabled) {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
}

.layer-del-btn:disabled {
  cursor: not-allowed;
  opacity: 0.2;
}

/* Layer Actions (Move Up/Down) */
.layer-actions {
  display: flex;
  border-top: 1px solid #333338;
  padding: 4px;
  gap: 4px;
}

.layer-move-btn {
  flex: 1;
  height: 30px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.layer-move-btn:hover:not(:disabled) {
  background: #33333a;
  color: #fff;
}

.layer-move-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

/* Scrollbar */
.layer-list::-webkit-scrollbar {
  width: 4px;
}

.layer-list::-webkit-scrollbar-track {
  background: transparent;
}

.layer-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

/* Responsive */
@media (max-width: 900px) {
  .layers-panel {
    width: 160px;
    min-width: 160px;
  }
}

@media (max-width: 640px) {
  .layers-panel {
    position: fixed;
    right: 0;
    top: 48px;
    bottom: 0;
    z-index: 20;
    width: 180px;
  }
}
</style>
