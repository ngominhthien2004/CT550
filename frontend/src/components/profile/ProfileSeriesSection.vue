<script setup>
import { computed } from 'vue'
import { formatShortDate } from '@/utils/date.js'
import { useRouter } from 'vue-router'

const props = defineProps({
  series: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const router = useRouter()

const typeConfig = {
  manga: { label: 'Manga Series', icon: 'fa-solid fa-book' },
  novel: { label: 'Novel Series', icon: 'fa-solid fa-pen-fancy' },
  illust: { label: 'Illust Series', icon: 'fa-solid fa-image' },
}

function getSeriesIcon(type) {
  return typeConfig[type]?.icon || 'fa-solid fa-book'
}

const seriesGroups = computed(() => {
  const types = ['manga', 'novel', 'illust']
  return types
    .map((type) => ({
      type,
      label: typeConfig[type]?.label || type,
      icon: typeConfig[type]?.icon || 'fa-solid fa-book',
      items: props.series.filter((s) => s.type === type),
    }))
    .filter((g) => g.items.length > 0)
})

function formatDate(dateStr) {
  return formatShortDate(dateStr)
}

function truncate(text, max) {
  if (!text || text.length <= max) return text || ''
  return text.slice(0, max).trimEnd() + '...'
}

function goToSeries(id) {
  router.push(`/series/${id}`)
}
</script>

<template>
  <div class="profile-series-section">
    <!-- Loading -->
    <div v-if="loading" class="series-loading">
      <p>Loading series...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="series-error">
      <p>{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="series.length === 0" class="series-empty">
      <i class="fa-solid fa-book"></i>
      <p>No series yet.</p>
    </div>

    <!-- Series groups by type -->
    <div v-else>
      <div v-for="group in seriesGroups" :key="group.type" class="series-group">
        <h3 class="series-group-title">
          <i :class="group.icon"></i> {{ group.label }}
        </h3>
        <div class="series-grid">
          <div
            v-for="s in group.items"
            :key="s._id"
            class="series-card"
            @click="goToSeries(s._id)"
            @keydown.enter.prevent="goToSeries(s._id)"
            @keydown.space.prevent="goToSeries(s._id)"
            tabindex="0"
            role="button"
          >
            <!-- Cover -->
            <div class="series-card-cover">
              <img
                v-if="s.coverImage"
                :src="s.coverImage"
                :alt="s.title"
                loading="lazy"
              />
              <div v-else class="series-card-nothumb">
                <i :class="getSeriesIcon(s.type)"></i>
              </div>
            </div>
            <!-- Info -->
            <div class="series-card-info">
              <span class="series-card-type" :class="'type-' + s.type">{{ s.type }}</span>
              <h4 class="series-card-title">{{ s.title }}</h4>
              <div class="series-card-meta">
                <span>{{ s.episodeCount || 0 }} {{ s.type === 'novel' ? 'chapter(s)' : 'episode(s)' }}</span>
                <span class="meta-sep">·</span>
                <span>{{ formatDate(s.createdAt) }}</span>
              </div>
              <p v-if="s.description" class="series-card-desc">{{ truncate(s.description, 120) }}</p>
              <div class="series-card-stats">
                <span><i class="fa-solid fa-eye"></i> {{ s.totalViews?.toLocaleString() || 0 }}</span>
                <span><i class="fa-solid fa-heart"></i> {{ s.totalLikes?.toLocaleString() || 0 }}</span>
                <span><i class="fa-solid fa-comment"></i> {{ s.totalComments?.toLocaleString() || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-series-section {
  padding-top: 2rem;
  display: grid;
  gap: 2rem;
}

/* ── States ── */

.series-loading,
.series-error {
  margin: 0;
  color: #6b7280;
  padding: 2rem 0;
}

.series-error p {
  color: #dc2626;
}

.series-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  color: #b4bac5;
}

.series-empty i {
  font-size: 1.55rem;
}

.series-empty p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

/* ── Group ── */

.series-group {
  display: grid;
  gap: 1rem;
}

.series-group-title {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1f2937;
}

.series-group-title i {
  width: 1.25rem;
  text-align: center;
}

/* ── Grid ── */

.series-grid {
  display: grid;
  gap: 1rem 0.9rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* ── Card ── */

.series-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.series-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* ── Cover ── */

.series-card-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.series-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.series-card-nothumb {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #b4bac5;
  font-size: 2.2rem;
  background: #f9fafb;
}

/* ── Info ── */

.series-card-info {
  padding: 0.85rem 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.series-card-type {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.18rem 0.5rem;
  border-radius: 4px;
  color: #fff;
  width: fit-content;
}

.series-card-type.type-manga {
  background: #22c55e;
}

.series-card-type.type-novel {
  background: #ec4899;
}

.series-card-type.type-illust {
  background: #6366f1;
}

.series-card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.series-card-meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.meta-sep {
  color: #d1d5db;
}

.series-card-desc {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-card-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  color: #9ca3af;
}

.series-card-stats span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.series-card-stats i {
  font-size: 0.68rem;
}

/* ── Responsive ── */

@media (max-width: 1240px) {
  .series-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .series-grid {
    grid-template-columns: 1fr;
  }

  .series-card-cover {
    height: 160px;
  }
}
</style>
