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

    <button type="button" class="icon-round" aria-label="More" title="More" @click="emit('open-search-options')">
      <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
    </button>
    <router-link to="/premium" class="premium-pill">Premium Free Trial</router-link>
  </div>
</template>

<style scoped>
.top-nav-left-right {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-left: auto;
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
}

.top-search {
  flex: 1 1 auto;
  width: clamp(420px, 50vw, 860px);
  min-width: 420px;
}

.icon-round {
  text-decoration: none;
  color: inherit;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.inline-menu {
  position: relative;
}

.inline-menu-panel {
  position: absolute;
  left: 0;
  top: calc(100% + 0.4rem);
  min-width: 238px;
  border: 1px solid #dce3ec;
  border-radius: 0.72rem;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 24;
  padding: 0.35rem;
  display: grid;
  gap: 0.1rem;
}

.inline-menu-item {
  border: none;
  background: transparent;
  color: #374151;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.2;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.46rem;
  padding: 0.45rem 0.54rem;
}

.inline-menu-item:hover,
.inline-menu-item:focus-visible,
.inline-menu-item.is-active {
  background: #f1f5f9;
}

.inline-menu-item i,
.inline-menu-spacer {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

.premium-pill {
  text-decoration: none;
  color: #f59e0b;
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
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
}
</style>
