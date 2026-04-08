<script setup>
const props = defineProps({
  latestArtwork: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['post'])

function formatDate(value) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
</script>

<template>
  <article class="recent-panel">
    <header class="recent-head">
      <p class="recent-title">Recently uploaded works <i class="fa-regular fa-circle-question" aria-hidden="true"></i></p>
      <button type="button" class="ghost-link">View all</button>
    </header>

    <div v-if="latestArtwork" class="recent-body">
      <p class="live-note"><span class="dot"></span> Updated in real time</p>
      <div class="work-card">
        <img v-if="latestArtwork.image" :src="latestArtwork.image" :alt="latestArtwork.title" class="work-thumb" loading="lazy" />
        <div v-else class="work-thumb fallback"><i class="fa-regular fa-image" aria-hidden="true"></i></div>

        <div class="work-copy">
          <p class="work-title">{{ latestArtwork.title }}</p>
          <p class="work-time">{{ formatDate(latestArtwork.createdAt) }}</p>
        </div>

        <button type="button" class="edit-btn" aria-label="Edit artwork">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>

        <div class="work-metrics">
          <span><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ latestArtwork.viewCount || 0 }}</span>
          <span><i class="fa-regular fa-thumbs-up" aria-hidden="true"></i> {{ latestArtwork.likeCount || 0 }}</span>
          <span><i class="fa-solid fa-heart" aria-hidden="true"></i> {{ latestArtwork.bookmarkCount || 0 }}</span>
          <span><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ latestArtwork.commentCount || 0 }}</span>
        </div>
      </div>

      <p class="updated-at">Views last updated: {{ formatDate(latestArtwork.updatedAt || latestArtwork.createdAt) }}</p>
    </div>

    <div v-else class="recent-empty">
      <i class="fa-regular fa-images" aria-hidden="true"></i>
      <p>Try posting your work</p>
      <button type="button" class="post-btn" @click="emit('post')">Post your work</button>
    </div>
  </article>
</template>

<style scoped>
.recent-panel {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
}

.recent-head {
  border-bottom: 1px solid #eef2f7;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.9rem;
}

.recent-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
}

.ghost-link {
  border: none;
  background: transparent;
  font-size: 0.75rem;
  color: #6b7280;
}

.recent-body {
  padding: 0.85rem 0.9rem 0.7rem;
}

.live-note {
  font-size: 0.68rem;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.65rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #84cc16;
}

.work-card {
  width: 275px;
  background: #f8fafc;
  border-radius: 10px;
  padding: 0.72rem;
  display: grid;
  grid-template-columns: 58px 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 0.65rem;
  row-gap: 0.58rem;
}

.work-thumb {
  width: 58px;
  height: 58px;
  border-radius: 8px;
  object-fit: cover;
  grid-row: 1 / 2;
}

.work-thumb.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #9ca3af;
}

.work-copy {
  align-self: center;
}

.work-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: #111827;
}

.work-time {
  margin-top: 0.2rem;
  font-size: 0.68rem;
  color: #9ca3af;
}

.edit-btn {
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0;
  width: 18px;
  height: 18px;
}

.work-metrics {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.32rem 0.72rem;
  font-size: 0.8rem;
  color: #374151;
}

.work-metrics span {
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
}

.updated-at {
  margin-top: 0.45rem;
  text-align: right;
  font-size: 0.66rem;
  color: #9ca3af;
}

.recent-empty {
  min-height: 160px;
  padding: 1rem 0.9rem;
  display: grid;
  place-items: center;
  gap: 0.5rem;
  color: #6b7280;
  text-align: center;
}

.recent-empty i {
  font-size: 1.8rem;
  color: #a3a3a3;
}

.post-btn {
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0.46rem 1rem;
}

@media (max-width: 980px) {
  .work-card {
    width: 100%;
  }
}
</style>
