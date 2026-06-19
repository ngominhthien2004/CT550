<template>
  <Teleport to="body">
    <div v-if="store.showPostDialog" class="modal-overlay" @click.self="store.showPostDialog = false" @keydown.enter.prevent="store.showPostDialog = false" @keydown.space.prevent="store.showPostDialog = false" tabindex="0" role="button">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Post Drawing</h2>
          <button type="button" class="modal-close-btn" @click="store.showPostDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="store.postPreviewUrl" class="post-preview">
            <img :src="store.postPreviewUrl" alt="Drawing preview" />
          </div>
          <div class="form-group">
            <label>Title *</label>
            <input v-model="store.postTitle" type="text" placeholder="Enter title" class="form-input" maxlength="100" aria-label="Drawing title" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <select v-model="store.postType" class="form-select" aria-label="Post type">
                <option value="illust">Illustration</option>
                <option value="manga">Manga</option>
                <option value="novel">Novel</option>
              </select>
            </div>
            <div class="form-group">
              <label>Age Rating</label>
              <select v-model="store.postAgeRating" class="form-select" aria-label="Age rating">
                <option value="all-ages">All Ages</option>
                <option value="r-18">R-18</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Tags (comma-separated)</label>
            <input v-model="store.postTags" type="text" placeholder="e.g. fanart, original character" class="form-input" aria-label="Tags" />
          </div>
          <p v-if="store.postError" class="form-error">{{ store.postError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="modal-btn cancel" @click="store.showPostDialog = false">Cancel</button>
          <button type="button" class="modal-btn submit" :disabled="store.postSubmitting" @click="submit">
            {{ store.postSubmitting ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useDrawingStore } from '../../stores/drawing.store.js'

const router = useRouter()
const store = useDrawingStore()

function submit() {
  store.submitPost(router)
}
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #333338;
}

.modal-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-btn.cancel {
  background: #33333a;
  color: #aaa;
}

.modal-btn.cancel:hover {
  background: #444;
  color: #fff;
}

.modal-btn.submit {
  background: #4a6cf7;
  color: #fff;
}

.modal-btn.submit:hover:not(:disabled) {
  background: #5b7df8;
}

.modal-btn.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Post preview */
.post-preview {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  max-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-preview img {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
}

/* Form fields */
.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 6px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1e;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #4a6cf7;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.form-error {
  color: #ff4757;
  font-size: 13px;
  margin: 8px 0 0;
}
</style>
