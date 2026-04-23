<script setup>
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
</script>

<template>
  <section class="feed-column">
    <header class="feed-head">
      <div>
        <h3>Recommended for you</h3>
        <p>Fresh artwork cards with a denser, Pixiv-like reading rhythm.</p>
      </div>
      <router-link to="/discovery">See more</router-link>
    </header>

    <p v-if="!works.length" class="empty-state">
      No recent works are available yet. Upload more content to build the home feed.
    </p>

    <div v-else class="feed-list">
      <article v-for="work in works" :key="work._id" class="feed-card">
        <header class="feed-card-head">
          <router-link :to="`/account?user=${work.user?._id || ''}`" class="author-link">
            <span v-if="work.user?.avatar" class="author-avatar">
              <img :src="work.user.avatar" :alt="work.user?.displayName || work.user?.username || work.title" />
            </span>
            <span v-else class="author-avatar fallback">{{ getAuthorInitial(work) }}</span>
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
  font-size: 1.05rem;
}

.feed-head p {
  color: #69758a;
  font-size: 0.85rem;
  margin-top: 0.18rem;
}

.feed-head a {
  text-decoration: none;
  color: #0096fa;
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
}

.empty-state {
  border: 1px dashed #d4dbe7;
  border-radius: 18px;
  background: #fff;
  padding: 1rem;
  color: #5f6b82;
}

.feed-list {
  display: grid;
  gap: 1rem;
}

.feed-card {
  border: 1px solid #e5e9f0;
  border-radius: 22px;
  background: #fff;
  padding: 0.85rem;
  display: grid;
  gap: 0.7rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
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
  background: #d7e4f8;
  flex-shrink: 0;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.author-avatar.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2450a8;
  font-weight: 700;
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
  color: #182133;
}

.author-meta small {
  color: #77839a;
  font-size: 0.77rem;
}

.feed-more {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: #f1f5fb;
  color: #556177;
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
  background: #ebf0f7;
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
  color: #192337;
  font-size: 0.94rem;
  font-weight: 700;
}

.feed-description {
  color: #68758c;
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
  border: 1px solid #dbe2ec;
  border-radius: 999px;
  background: #fff;
  color: #334155;
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
