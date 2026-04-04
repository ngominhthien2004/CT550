<script setup>
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

function handleToggleSidebar() {
  emit('toggle-sidebar')
}
</script>

<template>
  <header class="top-nav page-block">
    <div class="top-nav-left">
      <button type="button" class="icon-btn ghost" aria-label="Toggle sidebar" @click="handleToggleSidebar">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <strong class="top-site-name">{{ props.siteName }}</strong>
      <div class="search-box">{{ props.searchPlaceholder }}</div>
      <button class="icon-round" aria-label="Media" title="Media">
        <i class="fa-regular fa-image" aria-hidden="true"></i>
      </button>
      <button class="icon-round" aria-label="More" title="More">
        <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
      </button>
      <span class="premium-pill">Premium Free Trial</span>
    </div>
    <div class="top-nav-actions">
      <button class="icon-round" aria-label="Messages" title="Messages">
        <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      </button>
      <button class="icon-round" aria-label="Notifications" title="Notifications">
        <i class="fa-regular fa-bell" aria-hidden="true"></i>
      </button>
      <button class="post-btn">Post ▾</button>
      <button class="icon-round" aria-label="Account" title="Account">
        <i class="fa-regular fa-circle-user" aria-hidden="true"></i>
      </button>
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
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.68rem 0.95rem;
  color: #64748b;
  background: #f8fafc;
}

.icon-round {
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
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  background: #eef2f7;
  color: #1f2937;
  font-weight: 700;
}

.premium-pill {
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
