<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  rank: {
    type: Number,
    default: 0,
  },
})

const snippet = computed(() => {
  const text = String(props.item?.excerpt || props.item?.description || props.item?.novelContent || '').replace(/\s+/g, ' ').trim()
  if (!text) {
    return 'No synopsis has been added for this novel yet.'
  }

  return text.length > 150 ? `${text.slice(0, 150).trimEnd()}...` : text
})

const formatLabel = computed(() => (props.item?.series ? 'Series' : 'One-shot'))

const firstTag = computed(() => {
  const tags = props.item?.tags
  if (!tags?.length) {
    return ''
  }

  return tags[0].label || ''
})
function buildTagLink(tag) {
  const label = String(tag?.label || tag?.name || '').replace(/^#/, '').trim().toLowerCase()
  if (!label) {
    return ''
  }
  return { path: '/search', query: { type: 'novel', q: label } }
}

const visibleTags = computed(() => {
  const tags = props.item?.tags
  if (!tags?.length) {
    return []
  }

  return tags.slice(0, 4).filter((tag) => {
    const label = String(tag?.label || tag?.name || '').replace(/^#/, '').trim().toLowerCase()
    return label !== ''
  }).map(tag => ({
    ...tag,
    _link: buildTagLink(tag),
  }))
})

const chapterLabel = computed(() => {
  const count = Number(props.item?.chapterCount || 0)
  if (!count) {
    return ''
  }

  return `${count} ${count > 1 ? 'chapters' : 'chapter'}`
})

const authorLink = computed(() => {
  if (!props.item?.userId) {
    return ''
  }

  return `/account?user=${props.item.userId}`
})

</script>

<template>
  <article class="novel-compact-card">
    <router-link :to="`/novels/${item._id}`" class="novel-compact-cover">
      <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
      <div v-else class="novel-compact-fallback">
        <i class="fa-solid fa-book-open" aria-hidden="true"></i>
      </div>
      <div class="novel-compact-cover-badges">
        <span class="novel-compact-format">{{ formatLabel }}</span>
        <span v-if="firstTag" class="novel-compact-badge novel-compact-genre">{{ firstTag }}</span>
      </div>
      <span v-if="rank" class="novel-compact-rank">{{ rank }}</span>
      <span v-if="item.wordCount > 0" class="novel-compact-wordcount">{{ Number(item.wordCount).toLocaleString() }}w</span>
    </router-link>

    <div class="novel-compact-body">
      <div class="novel-compact-head">
        <router-link :to="`/novels/${item._id}`" class="novel-compact-title">{{ item.title || 'Untitled novel' }}</router-link>
        <span v-if="item.createdLabel" class="novel-compact-date">{{ item.createdLabel }}</span>
      </div>

      <router-link v-if="authorLink" :to="authorLink" class="novel-compact-author">
        <img :src="item.authorAvatar || 'https://s.pximg.net/common/images/no_profile.png'" :alt="item.authorName" />
        <span>{{ item.authorName }}</span>
      </router-link>

      <p class="novel-compact-excerpt">{{ snippet }}</p>

      <div v-if="visibleTags.length" class="novel-compact-tags">
        <router-link
          v-for="tag in visibleTags"
          :key="tag.label || tag.name"
          :to="tag._link"
        >
          {{ tag.label }}
        </router-link>
      </div>

      <footer class="novel-compact-meta">
        <span><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ Number(item.viewCount || 0).toLocaleString() }}</span>
        <span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ Number(item.likeCount || 0).toLocaleString() }}</span>
        <span><i class="fa-regular fa-bookmark" aria-hidden="true"></i> {{ Number(item.bookmarkCount || 0).toLocaleString() }}</span>
        <span v-if="item.wordCount">{{ Number(item.wordCount).toLocaleString() }} words</span>
        <span v-if="chapterLabel">{{ chapterLabel }}</span>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.novel-compact-card {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 0.82rem;
  padding: 0.85rem;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: var(--shadow-sm);
}

.novel-compact-cover {
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  background: var(--surface-alt);
}

.novel-compact-cover img,
.novel-compact-fallback {
  width: 100%;
  height: 100%;
}

.novel-compact-cover img {
  display: block;
  object-fit: cover;
}

.novel-compact-fallback {
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 1.8rem;
  background: linear-gradient(135deg, rgba(22, 149, 240, 0.08), rgba(148, 185, 109, 0.16));
}

.novel-compact-cover-badges {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  z-index: 1;
}

.novel-compact-rank {
  position: absolute;
  top: 6px;
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

.novel-compact-format,
.novel-compact-badge {
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}

.novel-compact-genre {
  background: rgba(22, 149, 240, 0.78);
}

.novel-compact-wordcount {
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

.novel-compact-body {
  display: grid;
  gap: 0.42rem;
  min-width: 0;
}

.novel-compact-head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: start;
}

.novel-compact-title {
  color: var(--text);
  text-decoration: none;
  font-size: 1rem;
  line-height: 1.35;
  font-weight: 800;
  min-width: 0;
}

.novel-compact-title:hover {
  color: var(--brand);
}

.novel-compact-date {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 700;
}

.novel-compact-author {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  color: var(--accent);
  font-weight: 700;
  font-size: 0.8rem;
}

.novel-compact-author img {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  object-fit: cover;
}

.novel-compact-excerpt {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
  font-size: 0.84rem;
}

.novel-compact-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.novel-compact-tags a {
  text-decoration: none;
  color: var(--brand);
  background: rgba(22, 149, 240, 0.08);
  border: 1px solid rgba(22, 149, 240, 0.08);
  border-radius: 999px;
  padding: 0.28rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.novel-compact-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 0.7rem;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.novel-compact-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
}

@media (max-width: 700px) {
  .novel-compact-card {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 0.7rem;
  }

  .novel-compact-title {
    font-size: 0.95rem;
  }
}
</style>
