<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  target: 'tag_partial',
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
  formState.target = typeof props.initialValues?.target === 'string' ? props.initialValues.target : 'tag_partial'
  formState.type = typeof props.initialValues?.type === 'string' ? props.initialValues.type : 'illust'
}

function closeModal() {
  emit('update:modelValue', false)
}

function resetDraft() {
  formState.includeAll = ''
  formState.includeAny = ''
  formState.exclude = ''
  formState.target = 'tag_partial'
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
    <div v-if="modelValue" class="search-options-backdrop" @click.self="closeModal" @keydown.enter.prevent="closeModal" @keydown.space.prevent="closeModal" tabindex="0" role="button">
      <section class="search-options-modal" role="dialog" aria-modal="true" :aria-label="$t('search.searchOption')">
        <header class="search-options-header">
          <h2 class="mb-0">{{ $t('search.searchOption') }}</h2>
        </header>

        <div class="search-options-body">
          <label class="field-block">
            <span class="field-label">{{ $t('search.includeAllKeywords') }}</span>
            <input v-model="formState.includeAll" type="text" :placeholder="$t('common.search')" :aria-label="$t('search.includeAllKeywords')" />
          </label>

          <label class="field-block">
            <span class="field-label">{{ $t('search.includeAnyKeywords') }}</span>
            <input v-model="formState.includeAny" type="text" :placeholder="$t('common.search')" :aria-label="$t('search.includeAnyKeywords')" />
          </label>

          <label class="field-block">
            <span class="field-label">{{ $t('search.excludeKeywords') }}</span>
            <input v-model="formState.exclude" type="text" :placeholder="$t('common.search')" :aria-label="$t('search.excludeKeywords')" />
          </label>

          <div class="field-grid">
            <label class="field-block">
              <span class="field-label">{{ $t('search.targets') }}</span>
              <select v-model="formState.target" :aria-label="$t('search.targets')">
                <option value="tag_partial">{{ $t('search.tagsPartial') }}</option>
                <option value="tag_exact">{{ $t('search.tagsPerfect') }}</option>
                <option value="title">{{ $t('search.targetTitle') }}</option>
                <option value="title_caption">{{ $t('search.titleDescription') }}</option>
                <option value="all">{{ $t('search.tagsTitlesDescriptions') }}</option>
              </select>
            </label>

            <label class="field-block">
              <span class="field-label">{{ $t('search.workType') }}</span>
              <select v-model="formState.type" :aria-label="$t('search.workType')">
                <option value="illust">{{ $t('search.illustrationType') }}</option>
                <option value="manga">{{ $t('search.mangaType') }}</option>
                <option value="gif">{{ $t('search.gifType') }}</option>
                <option value="novel">{{ $t('search.novelType') }}</option>
              </select>
            </label>
          </div>

          <button type="button" class="reset-btn" @click="resetDraft">{{ $t('common.reset') }}</button>
        </div>

        <footer class="search-options-actions">
          <button type="button" class="btn btn-primary" :disabled="!hasAnyInput" @click="applySearch">{{ $t('common.search') }}</button>
          <button type="button" class="btn btn-outline-secondary" @click="closeModal">{{ $t('common.cancel') }}</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.search-options-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
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
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  overflow: auto;
}

.search-options-header {
  padding: 1rem 1.15rem;
  border-bottom: 1px solid var(--line);
}

.search-options-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
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
  color: var(--text);
}

.field-block input,
.field-block select {
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 0.52rem 0.7rem;
  font-size: 0.92rem;
  color: var(--text);
  background-color: var(--surface);
}

.reset-btn {
  justify-self: center;
  border: none;
  background: transparent;
  color: var(--accent);
  font-weight: 700;
}

.search-options-actions {
  display: grid;
  gap: 0.55rem;
  padding: 1rem 1.15rem 1.15rem;
  border-top: 1px solid var(--line);
}

@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>