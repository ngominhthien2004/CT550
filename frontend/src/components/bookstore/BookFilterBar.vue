<script setup>
import { useI18n } from 'vue-i18n'

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

function updateField(field, value) {
  emit('update:filters', { ...props.filters, [field]: value })
}

function submitSearch() {
  emit('search')
}
</script>

<template>
  <div class="filter-bar page-block p-3">
    <div class="filter-row">
      <div class="filter-search">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input
            type="search"
            class="form-control"
            :placeholder="t('bookstore.searchBooks')"
            :value="filters.search"
            @input="updateField('search', $event.target.value)"
            @keydown.enter.prevent="submitSearch"
          />
        </div>
      </div>

      <select class="form-select filter-select" :value="filters.sort" @change="updateField('sort', $event.target.value)">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ t(option.labelKey) }}
        </option>
      </select>
    </div>

    <div class="filter-row price-row">
      <span class="price-label">{{ t('bookstore.price') }}:</span>
      <input
        type="number"
        class="form-control price-input"
        :placeholder="t('bookstore.minPrice')"
        min="0"
        :value="filters.minPrice"
        @input="updateField('minPrice', $event.target.value)"
      />
      <span class="price-separator">–</span>
      <input
        type="number"
        class="form-control price-input"
        :placeholder="t('bookstore.maxPrice')"
        min="0"
        :value="filters.maxPrice"
        @input="updateField('maxPrice', $event.target.value)"
      />
      <button type="button" class="btn btn-primary btn-sm" :disabled="loading" @click="submitSearch">
        <i class="fa-solid fa-filter me-1"></i> {{ t('bookstore.apply') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: grid;
  gap: 0.75rem;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.filter-search {
  flex: 1 1 240px;
  min-width: 200px;
}

.filter-select {
  flex: 0 1 180px;
  min-width: 150px;
}

.price-row {
  justify-content: flex-start;
}

.price-label {
  font-size: 0.9rem;
  color: var(--muted);
}

.price-input {
  width: 100px;
  flex: 0 0 auto;
}

.price-separator {
  color: var(--muted);
}

.input-group-text {
  background: var(--surface-alt);
  border-color: var(--line);
  color: var(--muted);
}
</style>
