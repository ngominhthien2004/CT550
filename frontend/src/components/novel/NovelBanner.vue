<script setup>
import { computed } from 'vue'

const props = defineProps({
  novel: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const fallbackCopy = 'A dedicated editorial landing page for novels, stories, and long-form reading.'

const coverStyle = computed(() => {
  const imageUrl = props.novel?.image
  if (!imageUrl) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(135deg, rgba(8, 15, 32, 0.76), rgba(8, 15, 32, 0.2)), url('${imageUrl}')`,
  }
})

const readLink = computed(() => (props.novel?._id ? `/novels/${props.novel._id}` : '/search?type=novel'))
const browseLink = '/search?type=novel&order=popular'

const stats = computed(() => [
  { label: 'Views', value: Number(props.novel?.viewCount || 0).toLocaleString() },
  { label: 'Likes', value: Number(props.novel?.likeCount || 0).toLocaleString() },
  { label: 'Bookmarks', value: Number(props.novel?.bookmarkCount || 0).toLocaleString() },
])

const formatLabel = computed(() => (props.novel?.series ? 'Series spotlight' : 'One-shot spotlight'))
const excerpt = computed(() => {
  const text = String(props.novel?.description || props.novel?.novelContent || fallbackCopy).replace(/\s+/g, ' ').trim()
  return text.length > 220 ? `${text.slice(0, 220).trimEnd()}...` : text
})
</script>

<template>
  <article class="novel-promo-banner" :class="{ 'is-loading': loading }">
    <div class="novel-promo-copy">
      <p class="novel-promo-kicker">Featured novel</p>
      <h2>{{ novel?.title || 'Explore the novel top page' }}</h2>
      <p class="novel-promo-excerpt">{{ excerpt }}</p>

      <div class="novel-promo-meta">
        <span>{{ formatLabel }}</span>
        <span>{{ novel?.authorName || novel?.user?.displayName || novel?.user?.username || 'Featured writer' }}</span>
        <span v-if="novel?.wordCount">{{ novel.wordCount.toLocaleString() }} words</span>
        <span v-if="novel?.createdLabel">{{ novel.createdLabel }}</span>
      </div>

      <div class="novel-promo-actions">
        <router-link :to="readLink" class="novel-promo-cta novel-promo-cta--primary">Read now</router-link>
        <router-link :to="browseLink" class="novel-promo-cta novel-promo-cta--secondary">Browse novels</router-link>
      </div>
    </div>

    <div class="novel-promo-visual" :style="coverStyle">
      <div v-if="novel?.image" class="novel-promo-cover-wrap">
        <img :src="novel.image" :alt="novel.title" loading="eager" class="novel-promo-cover" />
      </div>
      <div v-else class="novel-promo-fallback">
        <i class="fa-solid fa-book-open" aria-hidden="true"></i>
        <span>Featured novel art</span>
      </div>

      <dl class="novel-promo-stats">
        <div v-for="stat in stats" :key="stat.label" class="novel-promo-stat">
          <dt>{{ stat.label }}</dt>
          <dd>{{ stat.value }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>

<style scoped>
.novel-promo-banner {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 1rem;
  padding: 1rem;
  border-radius: 28px;
  border: 1px solid rgba(22, 149, 240, 0.12);
  background:
    radial-gradient(circle at top left, rgba(22, 149, 240, 0.16), transparent 42%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
  box-shadow: var(--shadow-md);
}

.novel-promo-banner.is-loading {
  opacity: 0.95;
}

.novel-promo-copy {
  display: grid;
  align-content: start;
  gap: 0.7rem;
  min-width: 0;
}

.novel-promo-kicker {
  margin: 0;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.novel-promo-copy h2 {
  margin: 0;
  font-size: clamp(1.6rem, 2.8vw, 2.6rem);
  line-height: 1.04;
  letter-spacing: -0.02em;
}

.novel-promo-excerpt {
  margin: 0;
  color: var(--muted);
  font-weight: 500;
  line-height: 1.6;
  max-width: 62ch;
}

.novel-promo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  color: var(--text);
  font-size: 0.84rem;
  font-weight: 700;
}

.novel-promo-meta span {
  padding: 0.34rem 0.65rem;
  border-radius: 999px;
  background: rgba(22, 149, 240, 0.08);
  border: 1px solid rgba(22, 149, 240, 0.08);
}

.novel-promo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding-top: 0.2rem;
}

.novel-promo-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.6rem;
  padding: 0.62rem 0.95rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 800;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.novel-promo-cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.novel-promo-cta--primary {
  background: var(--brand);
  color: var(--surface);
}

.novel-promo-cta--secondary {
  color: var(--text);
  border: 1px solid var(--line);
  background: var(--surface);
}

.novel-promo-visual {
  position: relative;
  display: grid;
  align-content: stretch;
  min-height: 320px;
  padding: 0.85rem;
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(9, 18, 43, 0.12), rgba(9, 18, 43, 0.76)),
    var(--surface-alt);
}

.novel-promo-cover-wrap,
.novel-promo-cover,
.novel-promo-fallback {
  width: 100%;
  height: 100%;
}

.novel-promo-cover-wrap {
  overflow: hidden;
  border-radius: 18px;
}

.novel-promo-cover {
  object-fit: cover;
  display: block;
}

.novel-promo-fallback {
  display: grid;
  place-items: center;
  gap: 0.6rem;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 700;
  text-align: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(24, 43, 89, 0.88), rgba(22, 149, 240, 0.5));
}

.novel-promo-fallback i {
  font-size: 2.8rem;
}

.novel-promo-stats {
  position: absolute;
  inset: auto 0.85rem 0.85rem 0.85rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.novel-promo-stat {
  padding: 0.6rem 0.7rem;
  border-radius: 16px;
  background: rgba(7, 13, 31, 0.66);
  backdrop-filter: blur(8px);
  color: var(--surface);
}

.novel-promo-stat dt {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.68);
  font-weight: 700;
}

.novel-promo-stat dd {
  margin: 0.15rem 0 0;
  font-size: 1rem;
  font-weight: 800;
}

@media (max-width: 920px) {
  .novel-promo-banner {
    grid-template-columns: 1fr;
  }

  .novel-promo-visual {
    min-height: 280px;
  }
}
</style>
