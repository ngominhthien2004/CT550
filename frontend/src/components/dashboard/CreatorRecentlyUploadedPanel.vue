<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  latestArtwork: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['post'])

const router = useRouter()

function goToArtwork() {
  if (props.latestArtwork?._id) {
    router.push(`/artworks/${props.latestArtwork._id}`)
  }
}

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
      <p class="recent-title">Recently uploaded works</p>
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

        <button type="button" class="edit-btn" aria-label="Edit artwork" @click="goToArtwork">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>

        <div class="work-metrics">
          <span><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ latestArtwork.viewCount || 0 }}</span>
          <span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ latestArtwork.likeCount || 0 }}</span>
          <span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ latestArtwork.bookmarkCount || 0 }}</span>
          <span><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ latestArtwork.commentCount || 0 }}</span>
        </div>
      </div>

      <p class="updated-at">Views last updated: {{ formatDate(latestArtwork.updatedAt || latestArtwork.createdAt) }}</p>
    </div>

    <div v-else class="recent-empty">
      <i class="fa-regular fa-images" aria-hidden="true"></i>
      <p>Try posting your work</p>
      <button type="button" class="action-pill" @click="emit('post')">Post your work</button>
    </div>
  </article>
</template>

<style scoped>
.recent-panel {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;
}

.recent-head {
  border-bottom: 1px solid var(--line);
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 1rem;
}

.recent-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.ghost-link {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
}

.ghost-link:hover {
  text-decoration: underline;
}

.recent-body {
  padding: 0.85rem 1rem 0.7rem;
}

.live-note {
  font-size: 0.68rem;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.65rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
}

.work-card {
  background: var(--surface-alt);
  border-radius: 10px;
  padding: 0.75rem;
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
  background: var(--line);
  color: var(--muted);
}

.work-copy {
  align-self: center;
}

.work-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text);
}

.work-time {
  margin-top: 0.2rem;
  font-size: 0.68rem;
  color: var(--muted);
}

.edit-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 0;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.edit-btn:hover {
  color: var(--accent);
}

.work-metrics {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.32rem 0.72rem;
  font-size: 0.8rem;
  color: var(--text);
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
  color: var(--muted);
}

.recent-empty {
  min-height: 160px;
  padding: 1.2rem 1rem;
  display: grid;
  place-items: center;
  gap: 0.5rem;
  color: var(--muted);
  text-align: center;
}

.recent-empty i {
  font-size: 1.8rem;
  color: var(--line);
}

.action-pill {
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.action-pill:hover {
  background: var(--accent-hover);
}
</style>
