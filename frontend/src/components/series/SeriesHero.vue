<script setup>
import { computed } from 'vue'
import { formatLongDate } from '../../utils/date.js'

const props = defineProps({
  series: { type: Object, required: true },
})

const coverUrl = computed(() => {
  const s = props.series
  if (s.coverImage) return s.coverImage
  const artworks = s.artworks
  if (Array.isArray(artworks) && artworks.length > 0) {
    const imgs = artworks[0].images
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0]
  }
  return ''
})

function formatDate(dateStr) {
  return formatLongDate(dateStr)
}

function getSeriesIcon(type) {
  switch (type) {
    case 'manga': return 'fa-solid fa-book'
    case 'novel': return 'fa-solid fa-pen-fancy'
    case 'illust': return 'fa-solid fa-image'
    default: return 'fa-solid fa-book'
  }
}
</script>

<template>
  <div class="series-hero">
    <div class="series-hero-cover">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="series.title"
      />
      <div v-else class="series-hero-nothumb">
        <i :class="getSeriesIcon(series.type)"></i>
      </div>
    </div>
    <div class="series-hero-info">
      <div class="series-hero-type">
        <span class="type-badge" :class="'type-' + series.type">
          <i :class="getSeriesIcon(series.type)"></i>
          {{ series.type }}
        </span>
        <span v-if="series.isCompleted" class="status-badge status-completed">
          <i class="fa-solid fa-check-circle"></i> Completed
        </span>
        <span v-else class="status-badge status-ongoing">
          <i class="fa-solid fa-play-circle"></i> Ongoing
        </span>
      </div>
      <h1 class="series-hero-title">{{ series.title }}</h1>
      <p v-if="series.description" class="series-hero-desc">{{ series.description }}</p>

      <div class="series-hero-stats">
        <div class="hero-stat">
          <i class="fa-solid fa-eye"></i>
          <span>{{ series.totalViews?.toLocaleString() || 0 }}</span>
          <span class="hero-stat-label">views</span>
        </div>
        <div class="hero-stat">
          <i class="fa-solid fa-heart"></i>
          <span>{{ series.totalLikes?.toLocaleString() || 0 }}</span>
          <span class="hero-stat-label">likes</span>
        </div>
        <div class="hero-stat">
          <i class="fa-solid fa-comment"></i>
          <span>{{ series.totalComments?.toLocaleString() || 0 }}</span>
          <span class="hero-stat-label">comments</span>
        </div>
        <div class="hero-stat">
          <i class="fa-regular fa-calendar"></i>
          <span>{{ formatDate(series.createdAt) }}</span>
        </div>
      </div>

      <div class="series-hero-episodes">
        {{ series.artworkCount || 0 }} {{ series.type === 'novel' ? 'chapter(s)' : 'episode(s)' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-hero {
  display: flex;
  gap: 1.5rem;
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.series-hero-cover {
  flex-shrink: 0;
  width: 220px;
  height: 220px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-alt);
}

.series-hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.series-hero-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--line);
  font-size: 3rem;
}

.series-hero-info {
  flex: 1;
  min-width: 0;
}

.series-hero-type {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #6366f1;
}

.type-novel { background: #fdf2f8; color: #ec4899; }
.type-manga { background: #f0fdf4; color: #22c55e; }
.type-illust { background: #eef2ff; color: #6366f1; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}

.status-completed { background: #f0fdf4; color: #16a34a; }
.status-ongoing { background: #fef3c7; color: #d97706; }

.series-hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.5rem;
  line-height: 1.3;
}

.series-hero-desc {
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.series-hero-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.hero-stat i { font-size: 0.8rem; width: 16px; text-align: center; }
.hero-stat i.fa-eye { color: #6366f1; }
.hero-stat i.fa-heart { color: #ef4444; }
.hero-stat i.fa-comment { color: #10b981; }

.hero-stat-label { font-size: 0.75rem; color: var(--muted); }

.series-hero-episodes { font-size: 0.8rem; color: var(--muted); }
</style>
