<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  initialValues: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'apply'])

const formState = reactive({
  includeAll: '',
  includeAny: '',
  exclude: '',
  target: 'all',
  type: 'illust',
})

const hasAnyInput = computed(() => {
  return (
    formState.includeAll.trim().length > 0
    || formState.includeAny.trim().length > 0
    || formState.exclude.trim().length > 0
  )
})

function syncFromProps() {
  formState.includeAll = typeof props.initialValues?.includeAll === 'string' ? props.initialValues.includeAll : ''
  formState.includeAny = typeof props.initialValues?.includeAny === 'string' ? props.initialValues.includeAny : ''
  formState.exclude = typeof props.initialValues?.exclude === 'string' ? props.initialValues.exclude : ''
  formState.target = typeof props.initialValues?.target === 'string' ? props.initialValues.target : 'all'
  formState.type = typeof props.initialValues?.type === 'string' ? props.initialValues.type : 'illust'
}

function closeModal() {
  emit('update:modelValue', false)
}

function resetDraft() {
  formState.includeAll = ''
  formState.includeAny = ''
  formState.exclude = ''
  formState.target = 'all'
}

function applySearch() {
  emit('apply', {
    includeAll: formState.includeAll.trim(),
    includeAny: formState.includeAny.trim(),
    exclude: formState.exclude.trim(),
    target: formState.target,
    type: formState.type,
  })
  closeModal()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      syncFromProps()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="search-options-backdrop" @click.self="closeModal">
      <section class="search-options-modal" role="dialog" aria-modal="true" aria-label="Search option">
        <header class="search-options-header">
          <h2 class="mb-0">Search option</h2>
        </header>

        <div class="search-options-body">
          <label class="field-block">
            <span class="field-label">Include all keywords</span>
            <input v-model="formState.includeAll" type="text" placeholder="Search artworks" />
          </label>

          <label class="field-block">
            <span class="field-label">Include any keywords</span>
            <input v-model="formState.includeAny" type="text" placeholder="Search artworks" />
          </label>

          <label class="field-block">
            <span class="field-label">Exclude keywords</span>
            <input v-model="formState.exclude" type="text" placeholder="Search artworks" />
          </label>

          <div class="field-grid">
            <label class="field-block">
              <span class="field-label">Targets</span>
              <select v-model="formState.target">
                <option value="all">All fields</option>
                <option value="title">Title only</option>
                <option value="tags">Tags only</option>
                <option value="artist">Artist only</option>
                <option value="description">Description only</option>
              </select>
            </label>

            <label class="field-block">
              <span class="field-label">Work type</span>
              <select v-model="formState.type">
                <option value="illust">Illustration</option>
                <option value="manga">Manga</option>
                <option value="ugoira">Ugoira</option>
                <option value="novel">Novel</option>
              </select>
            </label>
          </div>

          <button type="button" class="reset-btn" @click="resetDraft">Reset</button>
        </div>

        <footer class="search-options-actions">
          <button type="button" class="btn btn-primary" :disabled="!hasAnyInput" @click="applySearch">Search</button>
          <button type="button" class="btn btn-outline-secondary" @click="closeModal">Cancel</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.search-options-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.44);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1040;
  padding: 1rem;
  overflow-y: auto;
}

.search-options-modal {
  width: min(520px, 100%);
  max-height: calc(100vh - 2rem);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.24);
  overflow: auto;
}

.search-options-header {
  padding: 1rem 1.15rem;
  border-bottom: 1px solid #e2e8f0;
}

.search-options-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.search-options-body {
  padding: 1rem 1.15rem;
  display: grid;
  gap: 0.85rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.field-block {
  display: grid;
  gap: 0.38rem;
}

.field-label {
  font-size: 0.86rem;
  font-weight: 700;
  color: #334155;
}

.field-block input,
.field-block select {
  border: 1px solid #cbd5e1;
  border-radius: 11px;
  padding: 0.52rem 0.7rem;
  font-size: 0.92rem;
  color: #0f172a;
  background: #fff;
}

.reset-btn {
  justify-self: center;
  border: none;
  background: transparent;
  color: #3b82f6;
  font-weight: 700;
}

.search-options-actions {
  display: grid;
  gap: 0.55rem;
  padding: 1rem 1.15rem 1.15rem;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>