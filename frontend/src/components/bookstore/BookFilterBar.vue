<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomSelect from '@/components/common/CustomSelect.vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:filters', 'search'])

const { t } = useI18n()

// Store the option keys; resolve the label at render time so the
// select reflects the current locale when the user switches language.
const sortOptions = [
  { value: 'newest', labelKey: 'bookstore.sortLatest' },
  { value: 'priceAsc', labelKey: 'bookstore.sortPriceAsc' },
  { value: 'priceDesc', labelKey: 'bookstore.sortPriceDesc' },
  { value: 'popular', labelKey: 'bookstore.sortPopular' },
]

const bookSortOptions = computed(() =>
  sortOptions.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }))
)

function updateField(field, value) {
  emit('update:filters', { ...props.filters, [field]: value })
}

function submitSearch() {
  emit('search')
}
</script>

<template>
  <div class="bookstore-filter-toolbar">
    <div class="filter-tb-group">
      <span class="filter-tb-label">{{ t('bookstore.sortBy') }}:</span>
      <CustomSelect
        :model-value="filters.sort"
        :options="bookSortOptions"
        @update:modelValue="(v) => updateField('sort', v)"
      />
    </div>

    <div class="filter-tb-group filter-tb-price">
      <span class="filter-tb-label">{{ t('bookstore.price') }}:</span>
      <input
        type="number"
        class="filter-tb-input"
        :placeholder="t('bookstore.minPrice')"
        min="0"
        :value="filters.minPrice"
        @input="updateField('minPrice', $event.target.value)"
      />
      <span class="filter-tb-sep">–</span>
      <input
        type="number"
        class="filter-tb-input"
        :placeholder="t('bookstore.maxPrice')"
        min="0"
        :value="filters.maxPrice"
        @input="updateField('maxPrice', $event.target.value)"
      />
    </div>

    <button type="button" class="filter-tb-apply" :disabled="loading" @click="submitSearch">
      <i class="fa-solid fa-magnifying-glass me-1"></i> {{ t('bookstore.apply') }}
    </button>
  </div>
</template>

<style scoped>
.bookstore-filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  padding: 0.6rem 0;
}

.filter-tb-group {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.filter-tb-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}

.filter-tb-input {
  width: 80px;
  padding: 0.35rem 0.5rem;
  font: inherit;
  font-size: 0.85rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.18s ease;
}

.filter-tb-input:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
}

.filter-tb-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
}

.filter-tb-input::placeholder {
  color: var(--muted);
}

.filter-tb-sep {
  color: var(--muted);
  font-size: 0.85rem;
}

.filter-tb-apply {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
  font-family: inherit;
}

.filter-tb-apply:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.filter-tb-apply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
