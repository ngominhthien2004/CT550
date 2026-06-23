<script setup>
import { computed } from 'vue'

const props = defineProps({
  artwork: { type: Object, required: true },
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 0 },
})

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0)
}

const uploadedAtLabel = computed(() => {
  if (!props.artwork?.createdAt) return ''
  const d = new Date(props.artwork.createdAt)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})
</script>

<template>
  <div class="novel-header">
    <div class="novel-cover-wrapper">
      <img
        v-if="artwork.images?.[0]"
        :src="artwork.images[0]"
        :alt="artwork.title"
        class="novel-cover"
        loading="lazy"
      />
      <div v-else class="novel-cover-placeholder">
        <span class="placeholder-icon">📖</span>
      </div>
    </div>

    <div class="novel-header-info">
      <h1 class="novel-title">{{ artwork.title || 'Untitled' }}</h1>

      <div v-if="artwork.user" class="novel-author-row">
        <img
          :src="artwork.user.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
          :alt="artwork.user.displayName || artwork.user.username"
          class="header-author-avatar"
        />
        <router-link :to="`/account?user=${artwork.user._id}`" class="header-author-name">
          {{ artwork.user.displayName || artwork.user.username }}
        </router-link>
      </div>

      <div class="novel-meta-reading-time">
        <span class="meta-item">📝 {{ formatNumber(wordCount) }} words</span>
        <span class="meta-separator">·</span>
        <span class="meta-item">⏱️ {{ readingTime }} min read</span>
      </div>

      <div v-if="artwork.tags?.length" class="novel-tags">
        <router-link
          v-for="tag in artwork.tags"
          :key="tag._id || tag.name"
          :to="`/tags/${encodeURIComponent(tag.name)}`"
          class="novel-tag"
        >
          #{{ tag.name }}
        </router-link>
      </div>

      <div class="novel-stats">
        <span class="stat-item" title="Views">
          <i class="fa-regular fa-eye" aria-hidden="true"></i>
          {{ formatNumber(artwork.viewCount) }}
        </span>
        <span class="stat-item" title="Likes">
          <i class="fa-regular fa-heart" aria-hidden="true"></i>
          {{ formatNumber(artwork.likeCount) }}
        </span>
        <span class="stat-item" title="Bookmarks">
          <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
          {{ formatNumber(artwork.bookmarkCount) }}
        </span>
        <span class="stat-item" title="Comments">
          <i class="fa-regular fa-comment" aria-hidden="true"></i>
          {{ formatNumber(artwork.commentCount) }}
        </span>
      </div>

      <div class="novel-meta-secondary">
        <span v-if="uploadedAtLabel" class="meta-item">{{ uploadedAtLabel }}</span>
        <span v-if="uploadedAtLabel" class="meta-separator">·</span>
        <span class="meta-item">{{ artwork.type }} · {{ artwork.ageRating }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.novel-header {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1.5rem;
  align-items: start;
  text-align: left;
  padding: 1.5rem;
  background: var(--novel-surface);
  border-radius: 8px;
  border: 1px solid var(--novel-border);
  margin-bottom: 2rem;
}

.novel-cover-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  background: var(--novel-bg);
}

.novel-cover {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

.novel-cover-placeholder {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--novel-surface);
  color: var(--novel-muted);
}

.placeholder-icon { font-size: 2.5rem; opacity: 0.5; }

.novel-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.novel-title {
  font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  color: var(--novel-text-color);
}

.novel-author-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.2rem 0;
}

.header-author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--novel-border);
}

.header-author-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--novel-text-color);
  text-decoration: none;
}

.header-author-name:hover { color: var(--novel-accent); }

.novel-meta-reading-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--novel-muted);
  font-weight: 500;
}

.meta-separator { color: var(--novel-border); }

.novel-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--novel-muted);
  margin-top: 0.25rem;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.stat-item i { font-size: 0.9rem; width: 1rem; text-align: center; }

.novel-meta-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--novel-muted);
  font-weight: 400;
}

.novel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.2rem 0;
}

.novel-tag {
  text-decoration: none;
  color: var(--novel-accent);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: color-mix(in srgb, var(--novel-accent) 8%, transparent);
}

.novel-tag:hover {
  background: var(--novel-accent);
  color: #ffffff;
  text-decoration: none;
}
</style>
