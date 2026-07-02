<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  tagInput: {
    type: String,
    default: '',
  },
  allowTagEdit: {
    type: Boolean,
    default: true,
  },
  tagsCount: {
    type: Number,
    default: 0,
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
  suggestionLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:tagInput',
  'update:allowTagEdit',
  'input-keydown',
  'add-tag',
  'remove-tag',
  'select-suggestion',
])

const modelTagInput = computed({
  get: () => props.tagInput,
  set: (value) => emit('update:tagInput', value),
})

const modelAllowTagEdit = computed({
  get: () => props.allowTagEdit,
  set: (value) => emit('update:allowTagEdit', value),
})

const showSuggestionPanel = computed(() => modelTagInput.value.trim().length > 0)
</script>

<template>
  <!-- Single bordered card containing Tags input + Recommended + Checkbox -->
  <div class="tag-card">
    <!-- Top section: Required badge + Tags label | Input -->
    <div class="tag-main-row">
      <div class="row-left">
        <span class="required-badge">Required</span>
        <span class="row-label required-label">Tags</span>
      </div>
      <div class="row-center">
        <div class="tag-input-wrap">
          <div class="tag-input-row">
            <input
              id="upload-tags"
              v-model="modelTagInput"
              type="text"
              class="tag-input-field"
              placeholder="Tags"
              aria-label="Tags input"
              :disabled="!modelAllowTagEdit"
              @keydown="emit('input-keydown', $event)"
            />
            <span class="counter-badge">{{ props.tagsCount }}/10</span>
          </div>

          <!-- Suggestions dropdown -->
          <div v-if="showSuggestionPanel" class="tag-suggestion-panel" role="listbox" aria-label="Tag suggestions">
            <p v-if="props.suggestionLoading" class="small text-secondary mb-0">Loading suggestions...</p>
            <template v-else>
              <button
                v-for="suggestion in props.suggestions"
                :key="suggestion.name"
                type="button"
                class="tag-suggestion-item"
                @click="emit('select-suggestion', suggestion.name)"
              >
                <span class="tag-name">#{{ suggestion.name }}</span>
                <span class="tag-count">{{ suggestion.usageCount || 0 }} results</span>
              </button>
              <p v-if="props.suggestions.length === 0" class="small text-secondary mb-0">
                No matching tag. Press Space/Enter to create new tag.
              </p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Recommended Tags Row -->
    <div class="recommended-row">
      <div class="row-left">
        <span class="placeholder-badge"></span>
      </div>
      <div class="row-center">
        <div class="recommended-tags-inline">
          <span class="recommended-label">Recommended tags</span>
          <button type="button" class="recommend-chip" @click="emit('select-suggestion', 'Boy')">#Boy</button>
          <button type="button" class="recommend-chip" @click="emit('select-suggestion', 'Cat')">#Cat</button>
        </div>
      </div>
    </div>

    <!-- Active Selected Tags (only when tags exist) -->
    <div v-if="props.tags.length > 0" class="selected-tags-row">
      <div class="row-left">
        <span class="placeholder-badge"></span>
      </div>
      <div class="row-center">
        <div class="tag-list">
          <button
            v-for="(tag, index) in props.tags"
            :key="`${tag}-${index}`"
            type="button"
            class="tag-pill tag-pill--selected"
            :aria-label="`Remove tag ${tag}`"
            @click="emit('remove-tag', index)"
          >
            #{{ tag }}
            <span class="remove-x" aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Separator line -->
    <div class="card-separator"></div>

    <!-- Checkbox: Don't allow editing -->
    <div class="checkbox-row">
      <div class="row-left">
        <span class="placeholder-badge"></span>
      </div>
      <div class="row-center">
        <label class="custom-checkbox">
          <input v-model="modelAllowTagEdit" type="checkbox" aria-label="Don't allow other users to edit tags" />
          <span class="checkbox-indicator"></span>
          <span class="checkbox-label">Don't allow other users to edit tags</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/upload-form.css"></style>
<style scoped>
/* === Single card wrapper === */
.tag-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
  overflow: visible;
}

/* === Shared row grid === */
.tag-main-row,
.recommended-row,
.selected-tags-row,
.checkbox-row {
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: center;
  padding: 0.85rem 1.25rem;
}

.tag-main-row {
  padding-bottom: 0.5rem;
}

.recommended-row {
  padding-top: 0;
  padding-bottom: 0.65rem;
}

.selected-tags-row {
  padding-top: 0;
  padding-bottom: 0.65rem;
}

.checkbox-row {
  padding-top: 0.65rem;
  padding-bottom: 0.75rem;
}

/* === Tag input === */
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
  width: 100%;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 0.45rem 3.5rem 0.45rem 0.75rem;
  font-size: 0.88rem;
  color: var(--text);
  transition: border-color 0.2s;
  background-color: var(--surface);
}

.tag-input-field:focus {
  border-color: #0076ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 118, 255, 0.15);
}

.tag-input-field::placeholder {
  color: var(--muted);
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

/* === Recommended tags row === */
.recommended-tags-inline {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.84rem;
}

.recommended-label {
  color: #ea580c;
  font-weight: 500;
  white-space: nowrap;
}

.recommend-chip {
  background: none;
  border: none;
  padding: 0;
  color: #0076ff;
  font-size: 0.86rem;
  cursor: pointer;
  transition: opacity 0.2s;
  font-weight: 500;
}

.recommend-chip:hover {
  text-decoration: underline;
  opacity: 0.85;
}

/* === Selected tags pills === */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag-pill {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.84rem;
  padding: 0.28rem 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-pill--selected {
  background: #e6f4ea;
  border-color: #34a853;
  color: #137333;
}

.tag-pill--selected:hover {
  background: #fce8e6;
  border-color: #ea4335;
  color: #c5221f;
}

.remove-x {
  font-size: 0.95rem;
  line-height: 1;
  font-weight: bold;
}

/* === Card separator === */
.card-separator {
  height: 1px;
  background-color: var(--line);
  margin: 0 1.25rem;
}

/* === Suggestion panel === */
.tag-suggestion-panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  padding: 0.35rem;
  box-shadow: var(--shadow-md);
  display: grid;
  gap: 0.2rem;
  max-height: 220px;
  overflow-y: auto;
}

.tag-suggestion-item {
  border: 0;
  border-radius: 4px;
  text-align: left;
  padding: 0.5rem 0.65rem;
  font-size: 0.86rem;
  background: var(--surface);
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.tag-suggestion-item:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  color: var(--muted);
  font-size: 0.8rem;
}

/* === Responsive === */
@media (max-width: 991px) {
  .tag-main-row,
  .recommended-row,
  .selected-tags-row,
  .checkbox-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    align-items: flex-start;
  }

}
</style>
