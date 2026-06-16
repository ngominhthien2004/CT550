<template>
  <Teleport to="body">
    <div v-if="store.showSlotsDialog" class="modal-overlay" @click.self="store.showSlotsDialog = false">
      <div class="modal-content modal-content--wide">
        <div class="modal-header">
          <h2>Saved Drawings</h2>
          <button class="modal-close-btn" @click="store.showSlotsDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="store.savedSlots.length === 0" class="empty-state">
            <p>No saved drawings yet.</p>
          </div>
          <div v-else class="slots-grid">
            <div v-for="slot in store.savedSlots" :key="slot.id" class="slot-card">
              <img :src="slot.thumbnail" :alt="slot.name" class="slot-thumb" />
              <div class="slot-info">
                <span class="slot-name">{{ slot.name }}</span>
                <span class="slot-date">{{ store.formatDate(slot.timestamp) }}</span>
              </div>
              <div class="slot-actions">
                <button class="slot-btn load" @click="store.loadSlot(slot)">Load</button>
                <button class="slot-btn delete" @click="store.handleDeleteSlot(slot.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useDrawingStore } from '../../stores/drawing.store.js'

const store = useDrawingStore()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #222226;
  border: 1px solid #333338;
  border-radius: 12px;
  width: 460px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  color: #e0e0e0;
}

.modal-content--wide {
  width: 640px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333338;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.modal-close-btn {
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

.modal-close-btn:hover {
  background: #33333a;
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Save slots grid */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.slot-card {
  background: #1a1a1e;
  border: 1px solid #333338;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.slot-card:hover {
  border-color: #4a6cf7;
}

.slot-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  background: #fff;
}

.slot-info {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-date {
  font-size: 11px;
  color: #888;
}

.slot-actions {
  display: flex;
  border-top: 1px solid #333338;
}

.slot-btn {
  flex: 1;
  padding: 6px;
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slot-btn:hover {
  background: #33333a;
}

.slot-btn.load {
  border-right: 1px solid #333338;
  color: #4a6cf7;
}

.slot-btn.delete:hover {
  color: #ff4757;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 14px;
}
</style>
