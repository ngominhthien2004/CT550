<script setup>
defineProps({
  type: { type: String, default: 'card' }, // 'card', 'text', 'avatar', 'banner', 'artwork-card', 'user-card', 'feed-card'
  count: { type: Number, default: 1 },
})
</script>

<template>
  <!-- Existing: card variant -->
  <div v-if="type === 'card'" class="skeleton-grid skeleton-grid--5">
    <div v-for="i in count" :key="'sk-card-' + i" class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-line skeleton-line--short"></div>
      <div class="skeleton-line skeleton-line--medium"></div>
    </div>
  </div>
  
  <!-- NEW: artwork-card variant (6-column grid matching HomeArtworkGrid) -->
  <div v-else-if="type === 'artwork-card'" class="skeleton-artwork-grid">
    <div v-for="i in count" :key="'sk-art-' + i" class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-line skeleton-line--short"></div>
      <div class="skeleton-line skeleton-line--medium"></div>
    </div>
  </div>

  <!-- Existing: text variant -->
  <div v-else-if="type === 'text'" class="skeleton-text-block">
    <div v-for="i in count" :key="'sk-line-' + i" class="skeleton-line" :class="'skeleton-line--w' + ((i % 4 + 2) * 20)"></div>
  </div>
  
  <!-- Existing: avatar variant -->
  <div v-else-if="type === 'avatar'" class="skeleton-avatar-wrap">
    <div class="skeleton-avatar"></div>
  </div>
  
  <!-- Existing: banner variant -->
  <div v-else-if="type === 'banner'" class="skeleton-banner"></div>

  <!-- NEW: user-card variant (for Recommended Users sidebar) -->
  <div v-else-if="type === 'user-card'" class="skeleton-user-grid">
    <div v-for="i in count" :key="'sk-user-' + i" class="skeleton-user-card">
      <div class="skeleton-user-main">
        <div class="skeleton-user-avatar"></div>
        <div class="skeleton-user-meta">
          <div class="skeleton-line skeleton-line--medium"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
      </div>
      <div class="skeleton-user-btn"></div>
    </div>
  </div>

  <!-- NEW: feed-card variant (for HomeFeedColumn) -->
  <div v-else-if="type === 'feed-card'" class="skeleton-feed-list">
    <div v-for="i in count" :key="'sk-feed-' + i" class="skeleton-feed-card">
      <div class="skeleton-feed-header">
        <div class="skeleton-feed-avatar"></div>
        <div class="skeleton-line skeleton-line--medium" style="margin: 0; width: 120px;"></div>
      </div>
      <div class="skeleton-feed-image"></div>
      <div class="skeleton-line skeleton-line--w60" style="margin: 4px 0;"></div>
    </div>
  </div>
</template>

<style scoped>
/* ── Existing styles ── */
.skeleton-grid {
  display: grid;
  gap: 1rem 0.9rem;
}

.skeleton-grid--5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.skeleton-card {
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin: 8px 10px;
}

.skeleton-text-block {
  padding: 1rem 0;
}

.skeleton-line--short { width: 60%; }
.skeleton-line--medium { width: 80%; }
.skeleton-line--w40 { width: 40%; }
.skeleton-line--w60 { width: 60%; }
.skeleton-line--w80 { width: 80%; }
.skeleton-line--w100 { width: 100%; }

.skeleton-avatar-wrap {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.skeleton-avatar {
  width: 94px;
  height: 94px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-banner {
  height: 300px;
  border-radius: 18px;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* ── NEW: artwork-card variant (6-col grid, matching HomeArtworkGrid) ── */
.skeleton-artwork-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.8rem 0.72rem;
}

/* ── NEW: user-card variant (for Recommended Users sidebar) ── */
.skeleton-user-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

.skeleton-user-card {
  display: grid;
  gap: 0.65rem;
  padding: 0.75rem;
  background: var(--surface-alt);
  border-radius: 14px;
}

.skeleton-user-main {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.skeleton-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-user-meta {
  flex: 1;
  display: grid;
  gap: 4px;
  min-width: 0;
}

.skeleton-user-meta .skeleton-line {
  margin: 0;
}

.skeleton-user-btn {
  width: 72px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* ── NEW: feed-card variant (for HomeFeedColumn) ── */
.skeleton-feed-list {
  display: grid;
  gap: 1.5rem;
}

.skeleton-feed-card {
  display: grid;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
}

.skeleton-feed-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.skeleton-feed-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-feed-image {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  margin: 0 auto;
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1240px) { .skeleton-grid--5 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 920px) { .skeleton-grid--5 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

/* artwork-card responsive: matching HomeArtworkGrid breakpoints */
@media (max-width: 1200px) {
  .skeleton-artwork-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 920px) {
  .skeleton-artwork-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
