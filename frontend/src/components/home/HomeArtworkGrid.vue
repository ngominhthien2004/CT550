<script setup>
import { computed } from 'vue'
import ArtworkCard from '../artwork/ArtworkCard.vue'

const props = defineProps({
  works: {
    type: Array,
    default: () => [],
  },
})

const isNovelGrid = computed(() =>
  props.works.length > 0 && props.works.every((w) => w?.type === 'novel'),
)

const isMixedGrid = computed(() =>
  props.works.some((w) => w?.type === 'novel') && props.works.some((w) => w?.type !== 'novel'),
)

const processedWorks = computed(() =>
  props.works.map(w => ({ ...w, _isNovel: w?.type === 'novel' }))
)
</script>

<template>
  <section class="latest-section">
    <header class="section-head">
      <div>
        <h3>Recommended works</h3>
      </div>
      <router-link to="/discovery">View all</router-link>
    </header>

    <p v-if="!works.length" class="empty-state mb-0">
      Chua co artwork moi nhat de hien thi. Hay dang artwork dau tien de Home co noi dung.
    </p>

    <div v-else class="work-grid" :class="{ 'is-novel-grid': isNovelGrid }">
      <template v-for="work in processedWorks" :key="work._id || work.id">
        <div v-if="work._isNovel" class="novel-card-wrapper">
          <router-link :to="`/novels/${work._id}`" class="novel-grid-cover">
            <img v-if="work.image" :src="work.image" :alt="work.title" loading="lazy" />
            <div v-else class="novel-grid-fallback">
              <i class="fa-solid fa-book-open" aria-hidden="true"></i>
            </div>
            <span v-if="work.novelFormat === 'series'" class="novel-grid-badge">Series</span>
            <span v-else class="novel-grid-badge">One-shot</span>
            <span v-if="work.wordCount > 0" class="novel-grid-wordcount">
              {{ (work.wordCount || 0).toLocaleString() }}w
            </span>
          </router-link>
          <div class="novel-grid-meta">
            <router-link :to="`/novels/${work._id}`" class="novel-grid-title">{{ work.title }}</router-link>
            <router-link
              :to="`/account?user=${work.user?._id}`"
              class="novel-grid-author"
            >{{ work.user?.displayName || work.user?.username || 'Unknown' }}</router-link>
          </div>
        </div>
        <ArtworkCard v-else :item="work" class="work-card-override" />
      </template>
    </div>
  </section>
</template>

<style scoped>
.latest-section {
  display: grid;
  gap: 0.9rem;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 18px;
  padding: 0.9rem;
  color: var(--muted);
  background: var(--surface);
}

.section-copy {
  margin-top: 0.16rem;
  color: var(--muted);
  font-size: 0.84rem;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.8rem 0.72rem;
}

.work-grid.is-novel-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.work-card-override {
  transition: transform 0.16s ease;
}

.work-card-override:hover {
  transform: translateY(-2px);
}

/* Novel card in grid */
.novel-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.novel-grid-cover {
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-alt);
  text-decoration: none;
}

.novel-grid-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.novel-grid-cover:hover img {
  transform: scale(1.05);
}

.novel-grid-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 2rem;
  background:
    linear-gradient(135deg, rgba(22, 149, 240, 0.1), rgba(148, 185, 109, 0.14)),
    var(--surface-alt);
}

.novel-grid-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}

.novel-grid-wordcount {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}

.novel-grid-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.novel-grid-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--brand);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.novel-grid-title:hover {
  text-decoration: underline;
}

.novel-grid-author {
  font-size: 0.7rem;
  color: var(--accent);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.novel-grid-author:hover {
  text-decoration: underline;
}

@media (max-width: 1200px) {
  .work-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .work-grid.is-novel-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .work-grid.is-novel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
