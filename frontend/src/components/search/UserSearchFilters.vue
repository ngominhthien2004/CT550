<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  userFilterType: { type: String, required: true },
  userSortMode: { type: String, required: true },
})

const emit = defineEmits(['update:userFilterType', 'update:userSortMode', 'reload'])

const sortOpen = ref(false)
const sortRef = ref(null)

function onClickOutside(e) {
  if (sortRef.value && !sortRef.value.contains(e.target)) sortOpen.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const sortOptions = [
  { value: 'newest', labelKey: 'search.newest' },
  { value: 'popular', labelKey: 'search.popular' },
]
</script>

<template>
  <div class="user-search-filter-row">
    <div class="pill-select" ref="sortRef">
      <button type="button" class="pill-trigger" @click.stop="sortOpen = !sortOpen" :aria-label="$t('search.sortUsers')">
        {{ $t(sortOptions.find(o => o.value === userSortMode)?.labelKey || 'search.newest') }}
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div v-if="sortOpen" class="dd-panel">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="dd-item"
          :class="{ 'is-active': userSortMode === opt.value }"
          @click="emit('update:userSortMode', opt.value); emit('reload'); sortOpen = false"
        >
          {{ $t(opt.labelKey) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

<style scoped>
.user-search-filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
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
</style>
