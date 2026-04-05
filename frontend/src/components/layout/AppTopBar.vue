<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search illustrations/manga',
  },
})

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const route = useRoute()
const searchValue = ref(typeof route.query.q === 'string' ? route.query.q : '')

function handleToggleSidebar() {
  emit('toggle-sidebar')
}

async function submitSearch() {
  const normalizedQuery = searchValue.value.trim()
  await router.push({
    path: '/feed',
    query: normalizedQuery ? { q: normalizedQuery } : {},
  })
}

watch(
  () => route.query.q,
  (value) => {
    searchValue.value = typeof value === 'string' ? value : ''
  },
)
</script>

<template>
  <header class="top-nav page-block">
    <div class="top-nav-left">
      <button type="button" class="icon-btn ghost" aria-label="Toggle sidebar" @click="handleToggleSidebar">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <router-link to="/" class="top-site-name">{{ props.siteName }}</router-link>

      <form class="search-box" @submit.prevent="submitSearch">
        <input
          v-model="searchValue"
          type="search"
          :placeholder="props.searchPlaceholder"
          aria-label="Search artworks"
        />
      </form>

      <router-link to="/feed" class="icon-round" aria-label="Media" title="Media">
        <i class="fa-regular fa-image" aria-hidden="true"></i>
      </router-link>
      <router-link to="/rankings" class="icon-round" aria-label="More" title="More">
        <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
      </router-link>
      <router-link to="/bookmarks" class="premium-pill">Premium Free Trial</router-link>
    </div>
    <div class="top-nav-actions">
      <router-link to="/feed" class="icon-round" aria-label="Messages" title="Messages">
        <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      </router-link>
      <router-link to="/rankings" class="icon-round" aria-label="Notifications" title="Notifications">
        <i class="fa-regular fa-bell" aria-hidden="true"></i>
      </router-link>
      <router-link to="/" class="post-btn">Post ▾</router-link>
      <router-link to="/bookmarks" class="icon-round" aria-label="Account" title="Account">
        <i class="fa-regular fa-circle-user" aria-hidden="true"></i>
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.top-nav {
  padding: 0.55rem 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 72px;
}

.top-nav-left {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.top-site-name {
  text-decoration: none;
  font-size: 2rem;
  line-height: 1;
  color: #1695f0;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.top-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.icon-btn {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  font-size: 1rem;
  cursor: pointer;
}

.icon-btn.ghost {
  background: #f8fafc;
}

.search-box {
  flex: 1 1 340px;
  min-width: 220px;
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  overflow: hidden;
}

.search-box input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.68rem 0.95rem;
  color: #334155;
}

.search-box input:focus {
  outline: none;
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

.post-btn {
  text-decoration: none;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  background: #eef2f7;
  color: #1f2937;
  font-weight: 700;
}

.premium-pill {
  text-decoration: none;
  color: #f59e0b;
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
}

@media (max-width: 920px) {
  .top-nav-left {
    flex-wrap: wrap;
  }

  .search-box {
    flex-basis: 100%;
  }

  .top-nav-actions {
    flex-wrap: wrap;
  }
}
</style>
