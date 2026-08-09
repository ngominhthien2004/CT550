<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useLikeStore } from '../../stores/like.store'
import CardMenuDropdown from '@/components/common/CardMenuDropdown.vue'
import ReportModal from '@/components/common/ReportModal.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const likeStore = useLikeStore()
const authStore = useAuthStore()
const showReportModal = ref(false)
const isLoggedIn = computed(() => !!authStore.user)

const isLiked = computed(() => {
  if (likeStore.statusByArtwork[props.item._id] !== undefined) return likeStore.getLikeStatus(props.item._id)
  return Boolean(props.item.isLiked)
})

const isToggling = computed(() => likeStore.isTogglingLike(props.item._id))

async function handleLike(e) {
  e.preventDefault()
  e.stopPropagation()

  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (isToggling.value) return

  const previousStatus = isLiked.value
  const nextStatus = !previousStatus

  // Optimistic: flip immediately
  if (likeStore.statusByArtwork[props.item._id] === undefined) {
    likeStore.statusByArtwork[props.item._id] = previousStatus
  }
  likeStore.statusByArtwork[props.item._id] = nextStatus

  try {
    await likeStore.toggleLikeByArtwork(props.item._id)
  } catch {
    // Rollback on failure
    likeStore.statusByArtwork[props.item._id] = previousStatus
  }
}

function handleShare() {
  const url = `${window.location.origin}/novels/${props.item._id}`
  if (navigator.share) {
    navigator.share({ title: props.item.title, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).catch(() => {})
  }
}

const snippet = computed(() => {
  const text = String(props.item?.excerpt || props.item?.description || props.item?.novelContent || '').replace(/\s+/g, ' ').trim()
  if (!text) {
    return 'No synopsis has been added for this novel yet.'
  }

  return text.length > 150 ? `${text.slice(0, 150).trimEnd()}...` : text
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
  }).map(tag => {
    const label = String(tag?.label || tag?.name || '').replace(/^#/, '').trim().toLowerCase()
    return {
      ...tag,
      _label: label,
      _link: buildTagLink(tag),
    }
  })
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
    <CardMenuDropdown
      v-if="isLoggedIn"
      @share="handleShare"
      @report="showReportModal = true"
    />
    <div class="novel-cover-wrap">
      <router-link :to="`/novels/${item._id}`" class="novel-compact-cover">
        <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
        <div v-else class="novel-compact-fallback">
          <i class="fa-solid fa-book-open" aria-hidden="true"></i>
        </div>
        <span v-if="item.wordCount > 0" class="novel-compact-wordcount">{{ Number(item.wordCount).toLocaleString() }}w</span>
        <router-link
          v-if="item.series"
          :to="`/series/${item.series}`"
          class="novel-series-badge"
          :aria-label="$t('series.series')"
          :title="$t('series.series')"
          @click.stop
        >
          <span class="novel-series-badge-text">{{ $t('series.series') }}</span>
        </router-link>
      </router-link>

      <button
        type="button"
        class="novel-compact-like"
        :class="{ 'is-active': isLiked }"
        :aria-label="isLiked ? $t('artwork.unlike') : $t('artwork.like')"
        :disabled="isToggling"
        @click="handleLike"
      >
        <i :class="isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" aria-hidden="true"></i>
      </button>
    </div>

    <div class="novel-compact-body">
      <div class="novel-compact-head">
        <router-link :to="`/novels/${item._id}`" class="novel-compact-title">{{ item.title || 'Untitled novel' }}</router-link>
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
          #{{ tag._label }}
        </router-link>
      </div>

      <footer class="novel-compact-meta">
        <span><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ Number(item.viewCount || 0).toLocaleString() }}</span>
        <span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ Number(item.likeCount || 0).toLocaleString() }}</span>
        <span><i class="fa-regular fa-bookmark" aria-hidden="true"></i> {{ Number(item.bookmarkCount || 0).toLocaleString() }}</span>
        <span v-if="item.wordCount">{{ Number(item.wordCount).toLocaleString() }} words</span>
        <span v-if="item.createdLabel" class="novel-compact-date">{{ item.createdLabel }}</span>
      </footer>
    </div>

    <ReportModal
      :visible="showReportModal"
      report-type="artwork"
      :target="item"
      @close="showReportModal = false"
      @reported="showReportModal = false"
    />
  </article>
</template>

<style scoped>
.novel-compact-card {
  position: relative;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 0.82rem;
  padding: 0.85rem;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.novel-cover-wrap {
  position: relative;
  min-width: 0;
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

/* Triangle corner ribbon for "Series" on novel covers */
.novel-series-badge {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  width: 92px;
  height: 92px;
  background: linear-gradient(to bottom right, #facc15, #f59e0b);
  clip-path: polygon(0 0, 100% 0, 0 100%);
  text-decoration: none;
  pointer-events: auto;
  transition: filter 0.2s ease;
}

.novel-series-badge:hover {
  filter: brightness(1.06);
}

.novel-series-badge-text {
  position: absolute;
  top: 30px;
  left: 30px;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  transform: translate(-50%, -50%) rotate(-45deg);
  transform-origin: center center;
  white-space: nowrap;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  text-decoration: none;
  pointer-events: none;
}

.novel-series-badge:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

.novel-compact-wordcount {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: auto;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}

/* Mirrors .btn-like in ArtworkCard, sized for the compact novel cover */
.novel-compact-like {
  position: absolute;
  right: 0.4rem;
  bottom: 0.4rem;
  z-index: 6;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 999px;
  border: none;
  background: var(--surface);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s;
  box-shadow: var(--shadow-md);
  font-size: 0.85rem;
}

.novel-compact-like:hover {
  transform: scale(1.08);
}

.novel-compact-like.is-active {
  color: #ef4444;
}

/* keep a liked heart red even when the card area is hovered */
.novel-compact-card:hover .novel-compact-like.is-active,
.novel-compact-like.is-active:hover {
  color: #ef4444;
}

.novel-compact-like:disabled {
  opacity: 0.6;
  cursor: wait;
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
  margin-left: auto;
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
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
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
