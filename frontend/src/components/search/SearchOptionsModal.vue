<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'

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
  series: 'all',
  dateRange: { from: '', to: '' },
})

const hasAnyInput = computed(() => {
  return (
    formState.includeAll.trim().length > 0
    || formState.includeAny.trim().length > 0
    || formState.exclude.trim().length > 0
    || formState.series !== 'all'
    || formState.dateRange.from
    || formState.dateRange.to
  )
})

function syncFromProps() {
  formState.includeAll = typeof props.initialValues?.includeAll === 'string' ? props.initialValues.includeAll : ''
  formState.includeAny = typeof props.initialValues?.includeAny === 'string' ? props.initialValues.includeAny : ''
  formState.exclude = typeof props.initialValues?.exclude === 'string' ? props.initialValues.exclude : ''
  formState.target = typeof props.initialValues?.target === 'string' ? props.initialValues.target : 'tag_partial'
  formState.type = typeof props.initialValues?.type === 'string' ? props.initialValues.type : 'illust'
  formState.series = typeof props.initialValues?.series === 'string' ? props.initialValues.series : 'all'
  formState.dateRange = props.initialValues?.dateRange
    ? { from: props.initialValues.dateRange.from || '', to: props.initialValues.dateRange.to || '' }
    : { from: '', to: '' }
}

function closeModal() {
  emit('update:modelValue', false)
}

function resetDraft() {
  formState.includeAll = ''
  formState.includeAny = ''
  formState.exclude = ''
  formState.target = 'tag_partial'
  formState.series = 'all'
  formState.dateRange = { from: '', to: '' }
}

function applySearch() {
  emit('apply', {
    includeAll: formState.includeAll.trim(),
    includeAny: formState.includeAny.trim(),
    exclude: formState.exclude.trim(),
    target: formState.target,
    type: formState.type,
    series: formState.series,
    dateRange: { ...formState.dateRange },
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

const targetOptions = computed(() => [
  { value: 'tag_partial', label: t('search.tagsPartial') },
  { value: 'tag_exact', label: t('search.tagsPerfect') },
  { value: 'title', label: t('search.targetTitle') },
  { value: 'title_caption', label: t('search.titleDescription') },
  { value: 'all', label: t('search.tagsTitlesDescriptions') },
])

const typeOptions = computed(() => [
  { value: 'illust', label: t('search.illustrationType') },
  { value: 'manga', label: t('search.mangaType') },
  { value: 'gif', label: t('search.gifType') },
  { value: 'novel', label: t('search.novelType') },
])

const seriesOptions = computed(() => [
  { value: 'all', label: t('search.seriesAll') },
  { value: 'oneshot', label: t('search.seriesOneshot') },
  { value: 'series_only', label: t('search.seriesOnly') },
])
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="search-options-backdrop" @click.self="closeModal" @keydown.esc="closeModal" tabindex="0" role="dialog" aria-modal="true">
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
              <CustomSelect v-model="formState.target" :options="targetOptions" />
            </label>

            <label class="field-block">
              <span class="field-label">{{ $t('search.workType') }}</span>
              <CustomSelect v-model="formState.type" :options="typeOptions" />
            </label>

            <label class="field-block">
              <span class="field-label">{{ $t('search.seriesType') }}</span>
              <CustomSelect v-model="formState.series" :options="seriesOptions" />
            </label>
          </div>

          <label class="field-block">
            <span class="field-label">Date Range</span>
            <DateRangeFilter v-model="formState.dateRange" />
          </label>

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
  scrollbar-width: none;
}

.search-overlay::-webkit-scrollbar {
  display: none;
}

.search-options-modal {
  width: min(520px, 100%);
  max-height: calc(100vh - 2rem);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  overflow: auto;
  scrollbar-width: none;
}

.search-options-modal::-webkit-scrollbar {
  display: none;
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
  display: flex;
  gap: 0.55rem;
  padding: 1rem 1.15rem 1.15rem;
  border-top: 1px solid var(--line);
}

.search-options-actions .btn-primary {
  flex: 1;
}

.search-options-actions .btn-outline-secondary {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>