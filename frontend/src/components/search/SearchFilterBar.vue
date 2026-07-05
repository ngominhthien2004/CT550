<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  sortMode: { type: String, required: true },
  ageFilter: { type: String, required: true },
  currentSearchOptions: { type: Object, required: true },
  isNovelSearch: { type: Boolean, default: false },
  novelSortBy: { type: String, default: 'newest' },
  novelMinWords: { type: [String, Number], default: '' },
  novelMaxWords: { type: [String, Number], default: '' },
})

const emit = defineEmits(['update:sortMode', 'update:ageFilter', 'update:novelSortBy', 'update:novelMinWords', 'update:novelMaxWords'])

const sortOpen = ref(false)
const novelSortOpen = ref(false)
const sortRef = ref(null)
const novelSortRef = ref(null)

function onClickOutside(e) {
  if (sortRef.value && !sortRef.value.contains(e.target)) sortOpen.value = false
  if (novelSortRef.value && !novelSortRef.value.contains(e.target)) novelSortOpen.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const sortOptions = [
  { value: 'newest', labelKey: 'search.newest' },
  { value: 'popular', labelKey: 'search.sortByPopularity' },
]

const novelSortOptions = [
  { value: 'newest', labelKey: 'search.newest' },
  { value: 'views', labelKey: 'search.mostViewed' },
  { value: 'likes', labelKey: 'search.mostLiked' },
  { value: 'longest', labelKey: 'search.longest' },
  { value: 'shortest', labelKey: 'search.shortest' },
]
</script>

<template>
  <div class="filter-row">
    <div class="pill-select" ref="sortRef">
      <button type="button" class="pill-trigger" @click.stop="sortOpen = !sortOpen" :aria-label="$t('search.sortBy')">
        {{ $t(sortMode === 'popular' ? 'search.sortByPopularity' : 'search.newest') }}
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div v-if="sortOpen" class="dd-panel">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="dd-item"
          :class="{ 'is-active': sortMode === opt.value }"
          @click="emit('update:sortMode', opt.value); sortOpen = false"
        >
          {{ $t(opt.labelKey) }}
        </button>
      </div>
    </div>
    <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'safe' }" @click="emit('update:ageFilter', 'safe')">{{ $t('search.allAges') }}</button>
    <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'r18' }" @click="emit('update:ageFilter', 'r18')">{{ $t('search.r18') }}</button>
    <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'all' }" @click="emit('update:ageFilter', 'all')">{{ $t('search.all') }}</button>
    <span class="include-note">{{ $t('search.tagMatchMode') }} {{ currentSearchOptions.target === 'all' ? $t('search.allFields') : currentSearchOptions.target }}</span>

    <template v-if="isNovelSearch">
      <span class="filter-separator" aria-hidden="true"></span>
      <div class="pill-select" ref="novelSortRef">
        <button type="button" class="pill-trigger" @click.stop="novelSortOpen = !novelSortOpen" :aria-label="$t('search.novelSortBy')">
          {{ $t(novelSortOptions.find(o => o.value === novelSortBy)?.labelKey || 'search.newest') }}
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div v-if="novelSortOpen" class="dd-panel">
          <button
            v-for="opt in novelSortOptions"
            :key="opt.value"
            type="button"
            class="dd-item"
            :class="{ 'is-active': novelSortBy === opt.value }"
            @click="emit('update:novelSortBy', opt.value); novelSortOpen = false"
          >
            {{ $t(opt.labelKey) }}
          </button>
        </div>
      </div>
      <label class="word-range-label">
        <input
          :value="novelMinWords"
          type="number"
          class="word-range-input"
          :placeholder="$t('search.minWords')"
          min="0"
          :aria-label="$t('search.minWords')"
          @input="emit('update:novelMinWords', $event.target.value)"
        />
        <span class="word-range-sep">–</span>
        <input
          :value="novelMaxWords"
          type="number"
          class="word-range-input"
          :placeholder="$t('search.maxWords')"
          min="0"
          :aria-label="$t('search.maxWords')"
          @input="emit('update:novelMaxWords', $event.target.value)"
        />
      </label>
    </template>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill-select {
  position: relative;
  display: inline-block;
}

.pill-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.pill-trigger i {
  font-size: 0.55rem;
  opacity: 0.6;
  transition: transform 0.15s;
}

.pill-trigger:hover {
  background: var(--surface-alt);
  border-color: var(--muted);
}

.filter-chip {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip:hover {
  border-color: var(--muted);
}

.filter-chip.is-active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.include-note {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--muted);
}

.filter-separator {
  width: 1px;
  height: 1.2rem;
  background: var(--line);
  margin: 0 0.25rem;
}

.word-range-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.word-range-input {
  width: 5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 0.82rem;
  background: var(--surface);
  color: var(--text);
}

.word-range-sep {
  color: var(--muted);
}
</style>
