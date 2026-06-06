<script setup>
const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

defineProps({
  works: {
    type: Array,
    default: () => [],
  },
})

function getAuthorInitial(work) {
  const value = work?.user?.displayName || work?.user?.username || 'U'
  return value.charAt(0).toUpperCase()
}

function formatDate(value) {
  if (!value) {
    return 'Recently'
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function visibleImages(work) {
  const images = Array.isArray(work?.images) ? work.images.filter(Boolean) : []
  return images.slice(0, 4)
}

function imageGridClass(work) {
  const count = visibleImages(work).length
  if (count <= 1) return 'is-single'
  if (count === 2) return 'is-double'
  return 'is-mosaic'
}

function hasMultipleImages(work) {
  return visibleImages(work).length > 1
}

function profileLink(userId) {
  return userId ? `/account?user=${userId}` : '/account'
}

function profileAvatar(work) {
  return work?.user?.avatar || DEFAULT_PROFILE_AVATAR
}

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}
</script>

<template>
  <section class="feed-column">
    <header class="feed-head">
      <div>
        <h3>Recommended for you</h3>
      </div>
      <router-link to="/discovery">See more</router-link>
    </header>

    <p v-if="!works.length" class="empty-state">
      No recent works are available yet. Upload more content to build the home feed.
    </p>

    <div v-else class="feed-list">
      <article v-for="work in works" :key="work._id" class="feed-card">
        <header class="feed-card-head">
          <router-link :to="profileLink(work.user?._id)" class="author-link">
            <span class="author-avatar">
              <img
                :src="profileAvatar(work)"
                :alt="work.user?.displayName || work.user?.username || work.title"
                @error="handleAvatarError"
              />
            </span>
            <span class="author-meta">
              <strong>{{ work.user?.displayName || work.user?.username || 'Unknown artist' }}</strong>
              <small>{{ formatDate(work.createdAt) }}</small>
            </span>
          </router-link>
          <button type="button" class="feed-more" aria-label="Artwork menu">
            <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
          </button>
        </header>

        <router-link :to="`/artworks/${work._id}`" class="feed-cover" :class="imageGridClass(work)">
          <template v-for="image in visibleImages(work)" :key="image">
            <img :src="image" :alt="work.title" loading="lazy" />
          </template>

          <template v-if="hasMultipleImages(work)">
            <span class="feed-arrow left" aria-hidden="true">
              <i class="fa-solid fa-chevron-left"></i>
            </span>
            <span class="feed-arrow right" aria-hidden="true">
              <i class="fa-solid fa-chevron-right"></i>
            </span>
            <span class="feed-page-count" aria-hidden="true">{{ visibleImages(work).length }}</span>
          </template>
        </router-link>

        <div class="feed-card-body">
          <router-link :to="`/artworks/${work._id}`" class="feed-title">{{ work.title }}</router-link>
          <p class="feed-description">
            {{ work.description || 'Artwork details will appear here once the artist adds a caption.' }}
          </p>
          <div class="feed-actions" aria-label="Artwork actions">
            <button type="button" class="heart-btn" aria-label="Like artwork">
              <i class="fa-regular fa-heart" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.feed-column {
  display: grid;
  gap: 1rem;
}

.feed-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.8rem;
}

.feed-head h3 {
  font-size: 1.6rem;
}

.feed-head p {
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 0.18rem;
}

.feed-head a {
  text-decoration: none;
  color: var(--accent);
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 18px;
  background: var(--surface);
  padding: 1rem;
  color: var(--muted);
}

.feed-list {
  display: grid;
  gap: 1rem;
}

.feed-card {
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--surface);
  padding: 0.85rem;
  display: grid;
  gap: 0.7rem;
  box-shadow: var(--shadow-sm);
}

.feed-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.author-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 0;
  color: inherit;
}

.author-avatar {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  overflow: hidden;
  background: var(--surface-alt);
  flex-shrink: 0;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.author-meta {
  display: grid;
  min-width: 0;
}

.author-meta strong,
.author-meta small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-meta strong {
  font-size: 0.94rem;
  color: var(--brand);
}

.author-meta small {
  color: var(--muted);
  font-size: 0.77rem;
}

.feed-more {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--muted);
}

.feed-cover {
  display: grid;
  gap: 0.35rem;
  text-decoration: none;
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.feed-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  display: block;
  background: var(--surface-alt);
}

.feed-cover.is-single {
  grid-template-columns: 1fr;
  width: min(100%, 600px);
}

.feed-cover.is-double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 480px);
}

.feed-cover.is-mosaic {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 480px);
}

.feed-cover.is-single img {
  width: min(100%, 600px);
  height: min(100%, 600px);
  max-width: 600px;
  max-height: 600px;
}

.feed-cover.is-double img,
.feed-cover.is-mosaic img {
  width: min(100%, 480px);
  height: min(100%, 480px);
  max-width: 480px;
  max-height: 480px;
}

.feed-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.34);
  color: #fff;
  font-size: 0.95rem;
  backdrop-filter: blur(8px);
}

.feed-arrow.left {
  left: 0.75rem;
}

.feed-arrow.right {
  right: 0.75rem;
}

.feed-page-count {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.48);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
}

.feed-card-body {
  display: grid;
  gap: 0.42rem;
}

.feed-title {
  text-decoration: none;
  color: var(--brand);
  font-size: 0.94rem;
  font-weight: 700;
}

.feed-description {
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.heart-btn {
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

@media (max-width: 700px) {
  .feed-card {
    border-radius: 18px;
    padding: 0.8rem;
  }

  .feed-cover.is-double,
  .feed-cover.is-mosaic {
    grid-template-columns: 1fr 1fr;
  }

  .feed-arrow {
    width: 2rem;
    height: 2rem;
  }
}
</style>
