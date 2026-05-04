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
  <div class="upload-card">
    <div class="upload-row">
      <label for="upload-tags" class="row-label">Tags</label>
      <div class="row-content">
        <div class="tag-input-wrap">
          <div class="tag-input-row">
            <input
              id="upload-tags"
              v-model="modelTagInput"
              type="text"
              class="form-control"
              placeholder="Type tag, press Space/Enter to add"
              :disabled="!modelAllowTagEdit"
              @keydown="emit('input-keydown', $event)"
            />
            <span class="counter">{{ props.tagsCount }}/10</span>
          </div>

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
                <span class="tag-name">{{ suggestion.name }}</span>
                <span class="tag-count">{{ suggestion.usageCount || 0 }} results</span>
              </button>
              <p v-if="props.suggestions.length === 0" class="small text-secondary mb-0">
                No matching tag. Press Space/Enter to create new tag.
              </p>
            </template>
          </div>
        </div>

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
            <span aria-hidden="true">x</span>
          </button>
        </div>

        <p class="helper-text mb-0">Recommended tags appear while typing. Multi-word tags are normalized with underscore.</p>
      </div>
    </div>

    <div class="upload-row compact">
      <span class="row-label"></span>
      <label class="form-check mb-0">
        <input v-model="modelAllowTagEdit" class="form-check-input" type="checkbox" />
        <span class="form-check-label">Do not allow other users to edit tags</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.upload-card {
  border: 1px solid #dce4ee;
  border-radius: 8px;
  background: #fff;
}

.upload-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  border-bottom: 1px solid #edf2f8;
}

.upload-row.compact {
  border-bottom: 0;
}

.row-label {
  padding: 0.75rem 0.9rem;
  color: #6b7280;
  font-size: 0.84rem;
  border-right: 1px solid #edf2f8;
}

.row-content {
  padding: 0.55rem 0.8rem;
  display: grid;
  gap: 0.5rem;
}

.tag-input-wrap {
  position: relative;
}

.tag-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.counter {
  color: #9ca3af;
  font-size: 0.8rem;
  min-width: 2.4rem;
  text-align: right;
}

.tag-suggestion-panel {
  position: absolute;
  z-index: 5;
  top: calc(100% + 0.4rem);
  left: 0;
  right: 0;
  border: 1px solid #dbe2ec;
  border-radius: 0.65rem;
  background: #fff;
  padding: 0.4rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
  display: grid;
  gap: 0.3rem;
  max-height: 260px;
  overflow-y: auto;
}

.tag-suggestion-item {
  border: 0;
  border-radius: 0;
  text-align: left;
  padding: 0.55rem 0.6rem;
  font-size: 0.86rem;
  background: #fff;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f3f7;
}

.tag-suggestion-item:hover {
  background: #f9fbff;
}

.tag-name {
  font-size: 0.88rem;
}

.tag-count {
  color: #9ca3af;
  font-size: 0.82rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag-pill {
  border: 1px solid #d2dae6;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.84rem;
  padding: 0.28rem 0.56rem;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
}

.tag-pill--selected {
  background: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.helper-text {
  color: #86a53a;
  font-size: 0.76rem;
}

@media (max-width: 767px) {
  .upload-row {
    grid-template-columns: 1fr;
  }

  .row-label {
    border-right: 0;
    border-bottom: 1px solid #edf2f8;
    padding-bottom: 0.45rem;
  }
}
</style>
