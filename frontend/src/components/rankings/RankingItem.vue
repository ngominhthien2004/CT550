<script setup>
defineProps({
  item: { type: Object, required: true },
  rank: { type: Number, required: true },
})

const emit = defineEmits(['like', 'bookmark'])
</script>

<template>
  <article class="ranking-item">
    <div class="rank-side">
      <span class="rank-number" :class="item._rankClass">{{ rank }}</span>
      <div class="rank-trend">
        <i class="fas fa-minus"></i>
      </div>
    </div>

    <router-link :to="`/artworks/${item._id}`" class="rank-image-link">
      <img v-if="item._cover" :src="item._cover" :alt="item.title" class="rank-thumb" loading="lazy" />
      <div v-else class="rank-thumb-fallback">
        <i class="fa-solid fa-book-open" aria-hidden="true"></i>
      </div>
    </router-link>

    <div class="rank-info">
      <h3 class="rank-title">
        <router-link :to="`/artworks/${item._id}`">{{ item.title }}</router-link>
      </h3>
      <div class="rank-author">
        <router-link :to="`/users/${item.user?._id}/profile`" class="author-link">
          <img :src="item.user?.avatar || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27%239ca3af%27%3E%3Cpath d=%27M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z%27/%3E%3C/svg%3E'" :alt="item.user?.displayName || item.user?.username || 'User'" class="author-avatar" />
          <span class="author-name">{{ item.user?.displayName || item.user?.username }}</span>
        </router-link>
      </div>
      <div class="rank-stats-row">
        <span class="stat-label">
          <i class="fa-regular fa-eye"></i>
          {{ item._viewCount }}
        </span>
        <span class="stat-label">
          <i class="fa-regular fa-heart"></i>
          {{ item._likeCount }}
        </span>
        <span class="stat-label">
          <i class="fa-regular fa-bookmark"></i>
          {{ item._bookmarkCount }}
        </span>
      </div>
    </div>

    <div class="rank-actions">
      <button type="button"
        class="action-btn like-btn"
        :class="{ 'is-active': item._likeStatus }"
        :disabled="item._togglingLike"
        @click="emit('like', item)"
        aria-label="Like"
      >
        <i :class="item._likeStatus ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
        <span>{{ item._likeCount }}</span>
      </button>
      <button type="button"
        class="action-btn bookmark-btn"
        :class="{ 'is-active': item._bookmarkStatus }"
        :disabled="item._togglingBookmark"
        @click="emit('bookmark', item)"
        aria-label="Bookmark"
      >
        <i :class="item._bookmarkStatus ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
      </button>
    </div>
  </article>
</template>

<style scoped>
.ranking-item {
  display: flex;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s;
}

.ranking-item:last-child { border-bottom: none; }
.ranking-item:hover { background: var(--surface-alt); }

.rank-side {
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.rank-number {
  font-size: 24px;
  font-weight: 900;
  color: var(--muted);
}

.rank-top-1 { color: #facc15; font-size: 32px; }
.rank-top-2 { color: var(--muted); font-size: 28px; }
.rank-top-3 { color: #d97706; font-size: 26px; }

.rank-trend { font-size: 10px; color: var(--muted); margin-top: 4px; }

.rank-image-link {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-alt);
  display: block;
}

.rank-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.rank-thumb:hover { transform: scale(1.05); }

.rank-thumb-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(22, 149, 240, 0.08), rgba(148, 185, 109, 0.16));
  color: var(--muted);
  font-size: 3rem;
}

.rank-info {
  flex: 1;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-title { margin: 0; font-size: 18px; font-weight: 700; }
.rank-title a { color: var(--text); text-decoration: none; }
.rank-title a:hover { text-decoration: underline; }

.rank-author { display: flex; align-items: center; }

.author-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--muted);
  font-size: 14px;
}

.author-link:hover .author-name { color: var(--accent); }

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.rank-stats-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--muted);
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rank-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  width: 100%;
}

.action-btn:hover { background: var(--surface-alt); border-color: var(--accent); color: var(--accent); }

.action-btn.is-active { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
.action-btn.is-active:hover { background: #fee2e2; border-color: #ef4444; }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.bookmark-btn.is-active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
}

.like-btn span { font-size: 13px; }
</style>
