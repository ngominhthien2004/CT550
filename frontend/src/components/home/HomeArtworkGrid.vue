<script setup>
const objectIdPattern = /^[0-9a-fA-F]{24}$/

defineProps({
  works: {
    type: Array,
    default: () => [],
  },
})

function hasArtworkDetailRoute(work) {
  const artworkId = work?._id || work?.id
  return typeof artworkId === 'string' && objectIdPattern.test(artworkId)
}

function displayAuthor(work) {
  return work?.user?.displayName || work?.user?.username || 'Unknown artist'
}

function authorInitial(work) {
  return displayAuthor(work).charAt(0).toUpperCase()
}
</script>

<template>
  <section class="latest-section">
    <header class="section-head">
      <div>
        <h3>Recommended works</h3>
        <p class="section-copy">A denser artwork strip, closer to the Pixiv thumbnail rhythm.</p>
      </div>
      <router-link to="/discovery">View all</router-link>
    </header>

    <p v-if="!works.length" class="empty-state mb-0">
      Chua co artwork moi nhat de hien thi. Hay dang artwork dau tien de Home co noi dung.
    </p>

    <div v-else class="work-grid">
      <article v-for="work in works" :key="work._id || work.id" class="work-card">
        <router-link
          v-if="hasArtworkDetailRoute(work)"
          :to="`/artworks/${work._id || work.id}`"
          class="work-cover-link"
        >
          <img :src="work.image" :alt="work.title" loading="lazy" />
        </router-link>
        <div v-else class="image-wrap">
          <img :src="work.image" :alt="work.title" loading="lazy" />
        </div>

        <div class="work-meta">
          <div class="author-row">
            <router-link
              v-if="work.user?._id"
              :to="`/account?user=${work.user._id}`"
              class="author-link"
            >
              <span v-if="work.user?.avatar" class="author-avatar">
                <img :src="work.user.avatar" :alt="displayAuthor(work)" />
              </span>
              <span v-else class="author-avatar fallback">{{ authorInitial(work) }}</span>
              <span class="author-name">{{ displayAuthor(work) }}</span>
            </router-link>

            <div v-else class="author-link is-static">
              <span class="author-avatar fallback">{{ authorInitial(work) }}</span>
              <span class="author-name">{{ displayAuthor(work) }}</span>
            </div>
          </div>

          <router-link
            v-if="hasArtworkDetailRoute(work)"
            :to="`/artworks/${work._id || work.id}`"
            class="work-title-link"
            :title="work.title"
          >
            <strong class="work-title">{{ work.title }}</strong>
          </router-link>
          <strong v-else class="work-title" :title="work.title">{{ work.title }}</strong>
        </div>
      </article>
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
  background: #fff;
}

.section-copy {
  margin-top: 0.16rem;
  color: #68758c;
  font-size: 0.84rem;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.8rem 0.72rem;
}

.work-card {
  transition: transform 0.16s ease;
}

.work-card:hover {
  transform: translateY(-2px);
}

.work-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: cover;
  border-radius: 14px;
  display: block;
  background: #eef3f8;
}

.work-cover-link {
  display: block;
}

.image-wrap {
  position: relative;
}

.work-meta {
  padding: 0.44rem 0.12rem 0;
  display: grid;
  gap: 0.28rem;
  font-size: 0.86rem;
}

.author-row {
  min-width: 0;
}

.author-link {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  min-width: 0;
  text-decoration: none;
  color: #64748b;
}

.author-link.is-static {
  pointer-events: none;
}

.author-avatar {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 0;
  background: #d9e6fb;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-avatar.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2450a8;
  font-size: 0.68rem;
  font-weight: 700;
}

.author-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.74rem;
}

.work-title-link {
  text-decoration: none;
  color: inherit;
}

.work-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
  min-height: 2.5em;
  color: #1f2937;
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .work-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
