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
                <button class="slot-btn load" @click="store.requestLoadSlot(slot)">Load</button>
                <button class="slot-btn delete" @click="store.requestDeleteSlot(slot.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Load Slot Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showLoadSlotConfirm" class="confirm-overlay" @click.self="store.showLoadSlotConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Load Drawing</h3>
          <button class="confirm-close-btn" @click="store.showLoadSlotConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>Load this drawing? Current drawing will be replaced.</p>
        </div>
        <div class="confirm-footer">
          <button class="confirm-btn cancel" @click="store.showLoadSlotConfirm = false">Cancel</button>
          <button class="confirm-btn danger" @click="store.executeLoadSlot">Load</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Slot Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showDeleteSlotConfirm" class="confirm-overlay" @click.self="store.showDeleteSlotConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Delete Drawing</h3>
          <button class="confirm-close-btn" @click="store.showDeleteSlotConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>Delete this saved drawing?</p>
        </div>
        <div class="confirm-footer">
          <button class="confirm-btn cancel" @click="store.showDeleteSlotConfirm = false">Cancel</button>
          <button class="confirm-btn danger" @click="store.executeDeleteSlot">Delete</button>
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
  color: inherit;
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

/* Confirm modal styles */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-modal {
  background: #222226;
  border: 1px solid #333338;
  border-radius: 12px;
  width: 380px;
  max-width: 90vw;
  color: #e0e0e0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333338;
}

.confirm-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: inherit;
}

.confirm-close-btn {
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

.confirm-close-btn:hover {
  background: #33333a;
  color: #fff;
}

.confirm-body {
  padding: 20px;
}

.confirm-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #c0c0c0;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #333338;
}

.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-btn.cancel {
  background: #33333a;
  color: #aaa;
}

.confirm-btn.cancel:hover {
  background: #3a3a42;
  color: #e0e0e0;
}

.confirm-btn.danger {
  background: #e74c3c;
  color: #fff;
}

.confirm-btn.danger:hover {
  background: #c0392b;
}
</style>
