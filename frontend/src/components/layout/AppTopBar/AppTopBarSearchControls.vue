<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSearchBar from '../AppSearchBar.vue'

const props = defineProps({
  searchPlaceholder: {
    type: String,
    default: '',
  },
  searchScopes: {
    type: Array,
    default: () => [],
  },
  selectedSearchScope: {
    type: String,
    default: 'illust',
  },
})

const emit = defineEmits(['select-scope', 'open-search-options'])
const { t } = useI18n()
const isSearchScopeOpen = ref(false)
const placeholderText = computed(() => props.searchPlaceholder || t('search.searchPlaceholder'))
const selectedScope = computed(() => props.searchScopes.find((scope) => scope.key === props.selectedSearchScope))
const selectedScopeLabel = computed(() => selectedScope.value?.label || t('search.scopeLabel'))
const selectedScopeIcon = computed(() => selectedScope.value?.icon || 'fa-regular fa-image')
const selectedScopeQueryType = computed(() => selectedScope.value?.queryType || '')

function toggleSearchScopeMenu() {
  isSearchScopeOpen.value = !isSearchScopeOpen.value
}

function chooseSearchScope(scopeKey) {
  emit('select-scope', scopeKey)
  isSearchScopeOpen.value = false
}
</script>

<template>
  <div class="top-nav-left-right">
    <div class="search-unit">
      <AppSearchBar
        class="top-search"
        :placeholder="placeholderText"
        variant="compact"
        :search-scope="selectedScopeQueryType"
      >
        <template #trailing-control>
          <div class="inline-menu" @keydown.esc="isSearchScopeOpen = false">
            <button
              type="button"
              class="icon-round"
              :aria-label="$t('topbar.searchScope', { type: selectedScopeLabel })"
              :title="$t('topbar.searchScope', { type: selectedScopeLabel })"
              :aria-expanded="isSearchScopeOpen"
              @click="toggleSearchScopeMenu"
            >
              <img v-if="selectedScopeIcon.startsWith('/')" :src="selectedScopeIcon" class="scope-icon-img" alt="" aria-hidden="true" />
              <i v-else :class="['scope-icon', selectedScopeIcon]" aria-hidden="true"></i>
              <span class="scope-text">{{ selectedScopeLabel }}</span>
            </button>
            <div v-if="isSearchScopeOpen" class="dd-panel" role="menu" :aria-label="$t('search.scopeLabel')">
              <button
                v-for="scope in props.searchScopes"
                :key="scope.key"
                type="button"
                class="dd-item"
                :class="{ 'is-active': props.selectedSearchScope === scope.key }"
                role="menuitem"
                @click="chooseSearchScope(scope.key)"
              >
                <img v-if="scope.icon.startsWith('/')" :src="scope.icon" class="dd-item-icon-img" alt="" aria-hidden="true" />
                <i v-else :class="['dd-item-icon', scope.icon]" aria-hidden="true"></i>
                <span>{{ scope.label }}</span>
              </button>
            </div>
          </div>
        </template>
      </AppSearchBar>
    </div>

    <button type="button" class="icon-round" :aria-label="$t('search.more')" :title="$t('search.more')" @click="emit('open-search-options')">
      <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
    </button>
  </div>
</template>

<style scoped src="../../../assets/styles/dropdown.css"></style>

<style scoped>
/* ========================================
   Pixiv Charcoal — Top Bar Search Controls
   ======================================== */

.scope-icon-img {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  object-fit: contain;
}

.top-nav-left-right {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-left: auto;
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
}

/* Removed separator since Media is now part of search */

.search-unit {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex: 1 1 auto;
  min-width: 0;
}

.top-search {
  flex: 1 1 0;
  min-width: 0;
}

.icon-round {
  text-decoration: none;
  color: var(--text);
  border: none;
  background: transparent;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  overflow: hidden;
}

.icon-round:hover {
  background: var(--surface-alt);
}

/* Scope text - hide on small screens, show on large screens */
.scope-text {
  display: none;
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 0.3rem;
}

/* Show text on large screens */
@media (min-width: 921px) {
  .scope-text {
    display: inline-block;
  }
}

/* --- Scope Menu --- */
.inline-menu {
  position: static;
}

/* Search scope menu item sizing override */
.dd-panel .dd-item {
  padding: 0.4rem 0.5rem;
  font-size: 0.9rem;
}

@media (max-width: 920px) {
  .top-nav-left-right {
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .top-nav-left-right {
    gap: 0.35rem;
  }
}
</style>

<style>
.dark-theme .scope-icon-img {
  filter: invert(1);
}
</style>
