<template>
  <Teleport to="body">
    <div v-if="store.showPostDialog" class="modal-overlay" @keydown.esc="store.closePostDialog" tabindex="0" role="dialog" aria-modal="true">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ $t('drawing.postDrawing') }}</h2>
          <button type="button" class="modal-close-btn" @click="store.closePostDialog">&times;</button>
        </div>
        <form @submit.prevent="submit">
          <div class="modal-body">
            <div v-if="store.postPreviewUrl" class="post-preview">
              <img :src="store.postPreviewUrl" :alt="$t('drawing.drawingPreview')" />
            </div>
            <div class="form-group">
              <label>{{ $t('drawing.title') }} *</label>
              <input v-model="store.postTitle" type="text" :placeholder="$t('drawing.enterTitle')" class="form-input" maxlength="100" :aria-label="$t('drawing.title')" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ $t('drawing.type') }}</label>
                <select v-model="store.postType" class="form-select" :aria-label="$t('drawing.type')">
                  <option value="illust">{{ $t('drawing.illustration') }}</option>
                  <option value="manga">Manga</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ $t('drawing.ageRating') }}</label>
                <select v-model="store.postAgeRating" class="form-select" :aria-label="$t('drawing.ageRating')">
                  <option value="all">{{ $t('drawing.allAges') }}</option>
                  <option value="r-18">{{ $t('drawing.r18') }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>{{ $t('drawing.tags') }}</label>
              <div class="tag-input-wrap">
                <div class="tag-input-row">
                  <input
                    v-model="store.postTagInput"
                    type="text"
                    class="form-input tag-input-field"
                    :placeholder="$t('drawing.tagHint')"
                    :aria-label="$t('drawing.tags')"
                    @keydown="store.handlePostTagInputKeydown"
                  />
                  <span class="counter-badge">{{ store.postTags.length }}/10</span>
                </div>
                <!-- Suggestions dropdown -->
                <div v-if="showSuggestions" class="tag-suggestion-panel">
                  <p v-if="store.postTagSuggestionLoading" class="suggestion-hint">Đang tải...</p>
                  <template v-else>
                    <button
                      v-for="s in store.postTagSuggestions"
                      :key="s.name"
                      type="button"
                      class="tag-suggestion-item"
                      @click="store.handleSelectPostTagSuggestion(s.name)"
                    >
                      <span class="tag-name">#{{ s.name }}</span>
                      <span v-if="s.usageCount" class="tag-count">{{ s.usageCount }} kết quả</span>
                    </button>
                    <p v-if="store.postTagSuggestions.length === 0" class="suggestion-hint">Không có tag nào</p>
                  </template>
                </div>
              </div>
              <div v-if="store.postTags.length > 0" class="tag-list">
                <button
                  v-for="(tag, index) in store.postTags"
                  :key="index"
                  type="button"
                  class="tag-pill"
                  :aria-label="'Remove tag ' + tag"
                  @click="store.removePostTag(index)"
                >
                  #{{ tag }}
                  <span class="remove-x" aria-hidden="true">&times;</span>
                </button>
              </div>
            </div>
            <p v-if="store.postError" class="form-error">{{ store.postError }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="modal-btn cancel" @click="store.closePostDialog">{{ $t('drawing.cancel') }}</button>
            <button type="submit" class="modal-btn submit" :disabled="store.postSubmitting">
              {{ store.postSubmitting ? $t('drawing.posting') : $t('drawing.post') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDrawingStore } from '../../stores/drawing.store.js'

const router = useRouter()
const store = useDrawingStore()

const showSuggestions = computed(function () {
  return store.postTagInput.trim().length > 0
})

function submit() {
  store.submitPost(router)
}
</script>

<style scoped src="./drawing-modal-styles.css"></style>

<style scoped>
/* Override shared modal-body scroll — content fits without scrolling */
.modal-body {
  overflow: hidden;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--line);
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
  background: var(--surface-alt);
  color: var(--muted);
}

.modal-btn.cancel:hover {
  background: var(--line);
  color: var(--surface);
}

.modal-btn.submit {
  background: var(--accent);
  color: var(--surface);
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
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
  max-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-preview img {
  width: 100%;
  height: 160px;
  object-fit: cover;
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
  color: var(--muted);
  margin-bottom: 6px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--accent);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.form-error {
  color: var(--danger);
  font-size: 13px;
  margin: 8px 0 0;
}

/* ─── Tag Input ─────────────────────────────────────────────────── */
.tag-input-wrap {
  position: relative;
  width: 100%;
}

.tag-input-row {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.tag-input-field {
  padding-right: 3.5rem !important;
}

.counter-badge {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 0.8rem;
  pointer-events: none;
  user-select: none;
}

/* Tag pills */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-pill:hover {
  background: #fce8e6;
  border-color: #ea4335;
  color: #c5221f;
}

.remove-x {
  font-size: 14px;
  line-height: 1;
  font-weight: bold;
}

/* ─── Tag Suggestion Panel ─────────────────────────────────────── */
.tag-suggestion-panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  display: grid;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.tag-suggestion-item {
  border: 0;
  border-radius: 4px;
  text-align: left;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.tag-suggestion-item:hover {
  background: var(--surface-alt);
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  color: var(--muted);
  font-size: 12px;
}

.suggestion-hint {
  padding: 8px 10px;
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
