<script setup>
import { ref } from 'vue'
import AppSearchBar from '../AppSearchBar.vue'

const props = defineProps({
  searchPlaceholder: {
    type: String,
    default: 'Search by title, tag, or artist',
  },
  searchScopes: {
    type: Array,
    default: () => [],
  },
  selectedSearchScope: {
    type: String,
    default: 'artworks',
  },
})

const emit = defineEmits(['select-scope', 'open-search-options'])
const isSearchScopeOpen = ref(false)

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
      <AppSearchBar class="top-search" :placeholder="props.searchPlaceholder" variant="compact" />
      <div class="inline-menu" @keydown.esc="isSearchScopeOpen = false">
        <button
          type="button"
          class="icon-round"
          aria-label="Media"
          title="Media"
          :aria-expanded="isSearchScopeOpen"
          @click="toggleSearchScopeMenu"
        >
          <i class="fa-regular fa-image" aria-hidden="true"></i>
          <span class="scope-text">Media</span>
        </button>
        <div v-if="isSearchScopeOpen" class="inline-menu-panel" role="menu" aria-label="Search scope menu">
          <button
            v-for="scope in props.searchScopes"
            :key="scope.key"
            type="button"
            class="inline-menu-item"
            :class="{ 'is-active': props.selectedSearchScope === scope.key }"
            role="menuitem"
            @click="chooseSearchScope(scope.key)"
          >
            <i v-if="props.selectedSearchScope === scope.key" class="fa-solid fa-check" aria-hidden="true"></i>
            <span v-else class="inline-menu-spacer" aria-hidden="true"></span>
            {{ scope.label }}
          </button>
        </div>
      </div>
    </div>

    <button type="button" class="icon-round" aria-label="More" title="More" @click="emit('open-search-options')">
      <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
    </button>
    <router-link to="/premium" class="premium-pill">Premium Free Trial</router-link>
  </div>
</template>

<style scoped>
/* ========================================
   Pixiv Charcoal — Top Bar Search Controls
   ======================================== */

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
}

.top-search {
  flex: 1 1 auto;
  width: clamp(420px, 50vw, 860px);
  min-width: 420px;
}

.icon-round {
  text-decoration: none;
  color: #474747;
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
  background: rgba(0, 0, 0, 0.05);
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
  position: relative;
}

.inline-menu-panel {
  position: absolute;
  left: 0;
  top: calc(100% + 0.4rem);
  min-width: 238px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 24;
  padding: 0.35rem;
  display: grid;
  gap: 0.1rem;
}

.inline-menu-item {
  border: none;
  background: transparent;
  color: #474747;
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.2;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.46rem;
  padding: 0.4rem 0.5rem;
}

.inline-menu-item:hover,
.inline-menu-item:focus-visible,
.inline-menu-item.is-active {
  background: #f5f5f5;
}

.inline-menu-item i,
.inline-menu-spacer {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

/* --- Premium Link (less prominent) --- */
.premium-pill {
  text-decoration: none;
  color: #cc8800;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  transition: background 0.15s;
}

.premium-pill:hover {
  background: rgba(204, 136, 0, 0.08);
}

@media (max-width: 920px) {
  .top-nav-left-right {
    width: 100%;
    margin-left: 0;
  }

  .top-search {
    min-width: 0;
    flex-basis: 100%;
    width: 100%;
  }
  
  /* On small screens, the search unit should take full width */
  .search-unit {
    width: 100%;
  }
}
</style>
