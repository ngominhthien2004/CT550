<template>
  <Teleport to="body">
    <div v-if="store.showSlotsDialog" class="modal-overlay" @keydown.enter.prevent="store.showSlotsDialog = false" @keydown.space.prevent="store.showSlotsDialog = false" tabindex="0" role="button">
      <div class="modal-content modal-content--wide">
        <div class="modal-header">
          <h2 ref="dialogHeaderRef">{{ $t('drawing.savedDrawings') }}</h2>
          <button type="button" class="modal-close-btn" @click="store.showSlotsDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="store.savedSlots.length === 0" class="empty-state">
            <p>{{ $t('drawing.noSavedDrawings') }}</p>
          </div>
          <div v-else class="slots-grid">
            <div
              v-for="slot in store.savedSlots"
              :key="slot.id"
              class="slot-card"
              :class="{ selected: store.selectedSlotId === slot.id }"
              @click="store.selectSlot(slot.id)"
            >
              <img :src="slot.thumbnail" :alt="slot.name" class="slot-thumb" />
              <div class="slot-info">
                <!-- Rename input vs display name -->
                <template v-if="store.renamingSlotId === slot.id">
                  <input
                    ref="renameInputRef"
                    v-model="store.renamingSlotInput"
                    type="text"
                    class="rename-input"
                    maxlength="40"
                    @keydown.enter="store.commitRenameSlot()"
                    @keydown.escape="store.cancelRenameSlot()"
                    @click.stop
                    @blur="store.commitRenameSlot()"
                  />
                </template>
                <template v-else>
                  <span class="slot-name" @dblclick.stop="store.startRenameSlot(slot.id)">{{ slot.name }}</span>
                </template>
                <span class="slot-date">{{ store.formatDate(slot.timestamp) }}</span>
              </div>
              <div v-if="store.selectedSlotId === slot.id" class="slot-check">
                <i class="fa-solid fa-check" />
              </div>
            </div>
          </div>
        </div>
        <!-- Bottom action bar -->
        <div class="modal-footer action-bar">
          <div class="action-bar-left">
            <button
              type="button"
              class="action-btn action-btn--primary"
              :disabled="!store.selectedSlot"
              @click="handleLoad"
            >
              <i class="fa-solid fa-folder-open" /> {{ $t('drawing.load') }}
            </button>
            <button
              type="button"
              class="action-btn action-btn--primary"
              :disabled="!store.selectedSlot"
              @click="handleOverwrite"
            >
              <i class="fa-solid fa-pen" /> Ghi đè
            </button>
            <button
              type="button"
              class="action-btn action-btn--danger"
              :disabled="!store.selectedSlot"
              @click="handleDelete"
            >
              <i class="fa-solid fa-trash-can" /> {{ $t('drawing.delete') }}
            </button>
          </div>
          <div class="action-bar-right">
            <button
              type="button"
              class="action-btn action-btn--secondary"
              @click="handleSaveNew"
            >
              <i class="fa-solid fa-floppy-disk" /> Lưu bản mới
            </button>
            <button
              type="button"
              class="action-btn action-btn--cancel"
              @click="store.showSlotsDialog = false"
            >
              {{ $t('drawing.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Load Slot Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showLoadSlotConfirm" class="confirm-overlay" @keydown.enter.prevent="store.showLoadSlotConfirm = false" @keydown.space.prevent="store.showLoadSlotConfirm = false" tabindex="0" role="button">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>{{ $t('drawing.loadDrawing') }}</h3>
          <button type="button" class="confirm-close-btn" @click="store.showLoadSlotConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>{{ $t('drawing.loadDrawingDesc') }}</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showLoadSlotConfirm = false">{{ $t('drawing.cancel') }}</button>
          <button type="button" class="confirm-btn danger" @click="store.executeLoadSlot">{{ $t('drawing.load') }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Slot Confirm Modal -->
  <Teleport to="body">
    <div v-if="store.showDeleteSlotConfirm" class="confirm-overlay" @keydown.enter.prevent="store.showDeleteSlotConfirm = false" @keydown.space.prevent="store.showDeleteSlotConfirm = false" tabindex="0" role="button">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>{{ $t('drawing.deleteDrawing') }}</h3>
          <button type="button" class="confirm-close-btn" @click="store.showDeleteSlotConfirm = false">&times;</button>
        </div>
        <div class="confirm-body">
          <p>{{ $t('drawing.deleteDrawingDesc') }}</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="confirm-btn cancel" @click="store.showDeleteSlotConfirm = false">{{ $t('drawing.cancel') }}</button>
          <button type="button" class="confirm-btn danger" @click="store.executeDeleteSlot">{{ $t('drawing.delete') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useDrawingStore } from '../../stores/drawing.store.js'

const store = useDrawingStore()
const dialogHeaderRef = ref(null)
const renameInputRef = ref(null)

function handleOverlayClick() {
  store.clearSelection()
  store.showSlotsDialog = false
}

function handleLoad() {
  if (!store.selectedSlot) return
  store.requestLoadSlot(store.selectedSlot)
}

function handleOverwrite() {
  if (!store.selectedSlot) return
  store.overwriteSelectedSlot()
}

function handleDelete() {
  if (!store.selectedSlot) return
  store.requestDeleteSlot(store.selectedSlot.id)
}

function handleSaveNew() {
  store.saveNewSlotFromDialog()
  // Focus the dialog header after save so keyboard users stay in the dialog
  nextTick(function () {
    if (dialogHeaderRef.value) {
      dialogHeaderRef.value.focus({ preventScroll: true })
    }
  })
}

// Auto-focus rename input when rename starts
watch(function () { return store.renamingSlotId }, function (newVal) {
  if (newVal !== null) {
    nextTick(function () {
      if (renameInputRef.value) {
        renameInputRef.value.focus()
        renameInputRef.value.select()
      }
    })
  }
})
</script>

<style scoped src="./drawing-modal-styles.css"></style>

<style scoped>
.modal-content--wide {
  width: 640px;
}

/* Save slots grid */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.slot-card {
  position: relative;
  background: var(--surface-alt);
  border: 2px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.slot-card:hover {
  border-color: var(--accent);
}

.slot-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.3);
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
  cursor: text;
}

.slot-date {
  font-size: 11px;
  color: var(--muted);
}

.slot-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  pointer-events: none;
}

/* Rename input */
.rename-input {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid var(--accent);
  border-radius: 4px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  box-sizing: border-box;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  font-size: 14px;
}

/* ─── Bottom Action Bar ──────────────────────────────────────────── */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}

.action-bar-left,
.action-bar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  background: var(--surface);
  color: var(--text);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.action-btn--primary:not(:disabled):hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.action-btn--danger:not(:disabled):hover {
  background: var(--danger);
  color: #fff;
  border-color: var(--danger);
}

.action-btn--secondary:hover {
  background: var(--surface-alt);
  color: var(--accent);
  border-color: var(--accent);
}

.action-btn--cancel:hover {
  background: var(--surface-alt);
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
  background: var(--danger);
  opacity: 0.85;
}
</style>
