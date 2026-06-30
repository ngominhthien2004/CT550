<script setup>
defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  sortLabel: { type: String, default: 'Novels' },
})

const emit = defineEmits(['search-tag'])
</script>

<template>
  <p v-if="loading" class="state-note">Loading novels...</p>
  <p v-else-if="error" class="state-note error">{{ error }}</p>

  <p v-else-if="!items.length" class="state-note">No novels found for this tag. Try another keyword or search option.</p>

  <div v-else class="novel-result-stack">
    <div class="novel-section-head">
      <h2>{{ sortLabel }}</h2>
      <span>{{ items.length.toLocaleString() }} entries</span>
    </div>

    <article v-for="item in items" :key="item._id" class="novel-card" style="position:relative;">
      <router-link :to="`/artworks/${item._id}`" class="novel-cover">
        <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
        <div v-else class="novel-cover-fallback">
          <i class="fa-solid fa-book-open" aria-hidden="true"></i>
        </div>
        <span v-if="item.series" class="novel-cover-badge">Series</span>
        <span v-else class="novel-cover-badge">One-shot</span>
        <span v-if="item.wordCount > 0" class="novel-word-badge">
          <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
          {{ (item.wordCount || 0).toLocaleString() }}
        </span>
      </router-link>
      <div class="novel-body">
        <div class="novel-title-row">
          <img v-if="item.user" :src="item.user?.avatar || item.user?.profileImage || item.user?.image || ''" alt="author avatar" class="novel-author-avatar" />
          <router-link :to="`/artworks/${item._id}`" class="novel-title">{{ item.title }}</router-link>
        </div>
        <div class="novel-author-row">
          <router-link :to="`/account?user=${item.user?._id}`" class="novel-author">{{ item.user?.displayName || item.user?.username || 'Unknown writer' }}</router-link>
        </div>
        <p class="novel-excerpt">{{ item._excerpt }}</p>
        <div class="novel-tags" v-if="item.tags?.length">
          <button
            v-for="tag in item._tags"
            :key="tag._id || tag.name"
            type="button"
            @click="emit('search-tag', tag.name)"
          >
            #{{ tag.name }}
          </button>
        </div>
        <footer class="novel-meta">
          <span class="novel-meta-stat">
            <i class="fa-regular fa-eye" aria-hidden="true"></i>
            {{ (item.viewCount || 0).toLocaleString() }}
          </span>
          <span class="novel-meta-stat">
            <i class="fa-regular fa-heart" aria-hidden="true"></i>
            {{ (item.likeCount || 0).toLocaleString() }}
          </span>
          <span class="novel-meta-stat">
            <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
            {{ (item.bookmarkCount || 0).toLocaleString() }}
          </span>
          <span v-if="item.wordCount > 0" class="novel-meta-stat">
            <i class="fa-regular fa-clock" aria-hidden="true"></i>
            {{ item._readTime }} min read
          </span>
          <span v-if="item.series" class="novel-meta-stat">
            {{ item.chapterCount || 1 }} {{ (item.chapterCount || 1) > 1 ? 'chapters' : 'chapter' }}
          </span>
          <span>{{ item._formattedDate }}</span>
        </footer>
      </div>
      <button type="button" class="novel-bookmark-btn" :aria-label="`bookmark-${item._id}`">
        <i class="fa-regular fa-bookmark"></i>
      </button>
    </article>
  </div>
</template>

<style scoped>
.novel-result-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.novel-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.novel-section-head h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.novel-section-head span {
  color: var(--muted);
  font-size: 0.88rem;
}

.novel-card {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--line);
}

.novel-cover {
  position: relative;
  width: 140px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-alt);
}

.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.novel-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 2rem;
}

.novel-cover-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0,0,0,0.65);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.novel-word-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0,0,0,0.65);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.novel-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.novel-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.novel-author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.novel-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
}

.novel-title:hover {
  text-decoration: underline;
}

.novel-author-row {
  margin-top: 0.2rem;
}

.novel-author {
  font-size: 0.82rem;
  color: var(--muted);
  text-decoration: none;
}

.novel-author:hover {
  text-decoration: underline;
}

.novel-excerpt {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.novel-tags button {
  border: none;
  background: var(--surface-alt);
  color: var(--muted);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.novel-tags button:hover {
  background: var(--line);
}

.novel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: auto;
}

.novel-meta-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.novel-bookmark-btn {
  position: absolute;
  top: 1rem;
  right: 0;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.novel-bookmark-btn:hover {
  color: var(--accent);
}

.state-note {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}
</style>
