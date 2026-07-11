<script setup>
import { useRouter } from 'vue-router'
import { formatShortDate } from '../../utils/date.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  recentArtworks: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['post'])

const router = useRouter()
const { t } = useI18n()

function goToArtwork(artwork) {
  if (artwork?._id) {
    router.push(`/artworks/${artwork._id}/edit`)
  }
}

function formatDate(value) {
  if (!value) return '--'
  const result = formatShortDate(value)
  if (!result) return '--'
  return result
}
</script>

<template>
  <article class="recent-panel">
    <header class="recent-head">
      <p class="recent-title">{{ $t('dashboard.recentlyUploaded') }}</p>
      <button type="button" class="ghost-link">{{ $t('dashboard.viewAll') }}</button>
    </header>

    <div v-if="recentArtworks.length" class="recent-body">
      <p class="live-note"><span class="dot"></span> {{ $t('dashboard.updatedInRealTime') }}</p>
      <div class="work-cards">
        <div v-for="artwork in recentArtworks" :key="artwork._id" class="work-card">
          <img v-if="artwork.image" :src="artwork.image" :alt="artwork.title" class="work-thumb" loading="lazy" />
          <div v-else class="work-thumb fallback"><i class="fa-regular fa-image" aria-hidden="true"></i></div>

          <div class="work-copy">
            <p class="work-title">{{ artwork.title }}</p>
            <p class="work-time">{{ formatDate(artwork.createdAt) }}</p>
          </div>

          <button type="button" class="edit-btn" :aria-label="$t('dashboard.editArtworkLabel')" @click="goToArtwork(artwork)">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
          </button>

          <div class="work-metrics">
            <span><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ artwork.viewCount || 0 }}</span>
            <span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ artwork.likeCount || 0 }}</span>
            <span><i class="fa-regular fa-bookmark" aria-hidden="true"></i> {{ artwork.bookmarkCount || 0 }}</span>
            <span><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ artwork.commentCount || 0 }}</span>
          </div>
        </div>
      </div>

      <p class="updated-at">{{ $t('dashboard.viewsLastUpdated', { date: formatDate(recentArtworks[0]?.updatedAt || recentArtworks[0]?.createdAt) }) }}</p>
    </div>

    <div v-else class="recent-empty">
      <i class="fa-regular fa-images" aria-hidden="true"></i>
      <p>{{ $t('dashboard.tryPosting') }}</p>
      <button type="button" class="action-pill" @click="emit('post')">{{ $t('dashboard.postYourWork') }}</button>
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

.work-cards {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
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
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
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

.work-metrics span:nth-child(1) i { color: #6366f1; }  /* eye - indigo */
.work-metrics span:nth-child(2) i { color: var(--danger); }  /* heart - red */
.work-metrics span:nth-child(3) i { color: #f59e0b; }  /* bookmark - amber */
.work-metrics span:nth-child(4) i { color: #10b981; }  /* comment - emerald */

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
