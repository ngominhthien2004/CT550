<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrowseHistoryStore } from '@/stores/browseHistory.store'

defineProps({
  hasEntries: { type: Boolean, default: false },
  showFilters: { type: Boolean, default: false },
})
const emit = defineEmits(['clear-filters'])

const { t } = useI18n()
const browseHistoryStore = useBrowseHistoryStore()

const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
let searchDebounce = null

const hasActiveFilters = computed(() =>
  browseHistoryStore.search || browseHistoryStore.filterFrom || browseHistoryStore.filterTo
)

function onSearchInput(value) {
  searchQuery.value = value
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    browseHistoryStore.setSearch(value)
  }, 350)
}

function applyDateFilter() {
  browseHistoryStore.setFilters({ from: dateFrom.value, to: dateTo.value })
}

function clearAllFilters() {
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  browseHistoryStore.clearFilters()
  emit('clear-filters')
}
</script>

<template>
  <div v-if="hasEntries || hasActiveFilters" class="toolbar">
    <div class="search-box">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        type="text"
        :value="searchQuery"
        :placeholder="t('browseHistory.searchByTitle')"
        class="search-input"
        @input="onSearchInput($event.target.value)"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="search-clear"
        @click="onSearchInput('')"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div v-if="showFilters" class="filter-panel">
      <div class="filter-row">
        <label class="filter-label">{{ t('common.from') }}</label>
        <input
          type="date"
          v-model="dateFrom"
          class="filter-input"
          @change="applyDateFilter"
        />
      </div>
      <div class="filter-row">
        <label class="filter-label">{{ t('common.to') }}</label>
        <input
          type="date"
          v-model="dateTo"
          class="filter-input"
          @change="applyDateFilter"
        />
      </div>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="btn-clear-filters"
        @click="clearAllFilters"
      >
        <i class="fa-solid fa-xmark"></i> {{ t('common.reset') }}
      </button>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/search-filter.css"></style>
