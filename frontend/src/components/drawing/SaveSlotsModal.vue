<template>
  <Teleport to="body">
    <div v-if="store.showSlotsDialog" class="modal-overlay" @click.self="store.showSlotsDialog = false" @keydown.enter.prevent="store.showSlotsDialog = false" @keydown.space.prevent="store.showSlotsDialog = false" tabindex="0" role="button">
      <div class="modal-content modal-content--wide">
        <div class="modal-header">
          <h2>Saved Drawings</h2>
          <button type="button" class="modal-close-btn" @click="store.showSlotsDialog = false">&times;</button>
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
                <button type="button" class="slot-btn load" @click="store.requestLoadSlot(slot)">Load</button>
                <button type="button" class="slot-btn delete" @click="store.requestDeleteSlot(slot.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Load Slot Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showLoadSlotConfirm" class="confirm-overlay" @click.self="store.showLoadSlotConfirm = false" @keydown.enter.prevent="store.showLoadSlotConfirm = false" @keydown.space.prevent="store.showLoadSlotConfirm = false" tabindex="0" role="button">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Load Drawing</h3>
          <button type="button" class="confirm-close-btn" @click="store.showLoadSlotConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>Load this drawing? Current drawing will be replaced.</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showLoadSlotConfirm = false">Cancel</button>
          <button type="button" class="confirm-btn danger" @click="store.executeLoadSlot">Load</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Slot Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showDeleteSlotConfirm" class="confirm-overlay" @click.self="store.showDeleteSlotConfirm = false" @keydown.enter.prevent="store.showDeleteSlotConfirm = false" @keydown.space.prevent="store.showDeleteSlotConfirm = false" tabindex="0" role="button">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Delete Drawing</h3>
          <button type="button" class="confirm-close-btn" @click="store.showDeleteSlotConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>Delete this saved drawing?</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showDeleteSlotConfirm = false">Cancel</button>
          <button type="button" class="confirm-btn danger" @click="store.executeDeleteSlot">Delete</button>
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
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  width: 460px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  color: var(--text);
}

.modal-content--wide {
  width: 640px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
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
  color: var(--muted);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: var(--surface-alt);
  color: var(--surface);
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
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.slot-card:hover {
  border-color: var(--accent);
}

.slot-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  background: var(--surface);
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
  color: var(--muted);
}

.slot-actions {
  display: flex;
  border-top: 1px solid var(--line);
}

.slot-btn {
  flex: 1;
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slot-btn:hover {
  background: var(--surface-alt);
}

.slot-btn.load {
  border-right: 1px solid var(--line);
  color: var(--accent);
}

.slot-btn.delete:hover {
  color: var(--danger);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
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
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  width: 380px;
  max-width: 90vw;
  color: var(--text);
  box-shadow: var(--shadow-lg);
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
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
  color: var(--muted);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-close-btn:hover {
  background: var(--surface-alt);
  color: var(--surface);
}

.confirm-body {
  padding: 20px;
}

.confirm-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--line);
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
  background: var(--surface-alt);
  color: var(--muted);
}

.confirm-btn.cancel:hover {
  background: var(--line);
  color: var(--text);
}

.confirm-btn.danger {
  background: var(--danger);
  color: var(--surface);
}

.confirm-btn.danger:hover {
  background: #c0392b;
}
</style>
