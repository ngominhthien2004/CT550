<script setup>
defineProps({
  artwork: {
    type: Object,
    required: true,
  },
  displayAuthor: {
    type: String,
    default: 'Unknown artist',
  },
  relatedWorks: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <article class="artwork-detail-template d-grid gap-4">
    <section class="post-shell d-grid gap-3">
      <div class="post-card card border-0 shadow-sm">
        <div class="card-body p-3 p-md-4 d-grid gap-3">
          <img
            v-if="artwork.images?.[0]"
            class="img-fluid rounded-3 border w-100 main-image"
            :src="artwork.images[0]"
            :alt="artwork.title"
            loading="lazy"
          />

          <div class="post-actions d-flex align-items-center justify-content-end gap-3">
            <button type="button" class="btn btn-sm btn-light" aria-label="Like">
              <i class="fa-regular fa-heart" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-sm btn-light" aria-label="Bookmark">
              <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-sm btn-light" aria-label="More options">
              <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
            </button>
          </div>

          <div class="d-grid gap-2">
            <h2 class="h5 mb-0 title">{{ artwork.title }}</h2>
            <p class="text-secondary small mb-0">{{ artwork.type }} · {{ artwork.ageRating }}</p>
            <p v-if="artwork.description" class="description mb-0">{{ artwork.description }}</p>

            <div v-if="artwork.tags?.length" class="d-flex flex-wrap gap-2 align-items-center">
              <router-link
                v-for="tag in artwork.tags"
                :key="tag._id || tag.name"
                :to="`/tags/${encodeURIComponent(tag.name)}`"
                class="tag-pill"
              >
                #{{ tag.name }}
              </router-link>
            </div>
          </div>

          <div class="meta-inline d-flex flex-wrap align-items-center gap-2 text-secondary small">
            <span><i class="fa-regular fa-eye me-1" aria-hidden="true"></i>{{ artwork.viewCount }}</span>
            <span><i class="fa-regular fa-heart me-1" aria-hidden="true"></i>{{ artwork.likeCount }}</span>
            <span><i class="fa-regular fa-bookmark me-1" aria-hidden="true"></i>{{ artwork.bookmarkCount }}</span>
            <span><i class="fa-regular fa-comment me-1" aria-hidden="true"></i>{{ artwork.commentCount }}</span>
          </div>
        </div>
      </div>

      <div class="author-card card border-0 shadow-sm">
        <div class="card-body d-flex align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-2">
            <span class="avatar-dot" aria-hidden="true"></span>
            <div>
              <p class="mb-0 fw-semibold">{{ displayAuthor }}</p>
              <p class="mb-0 text-secondary small">Following</p>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary">Follow</button>
        </div>
      </div>

      <div class="comments-card card border-0 shadow-sm">
        <div class="card-body d-grid gap-2">
          <div class="d-flex align-items-center justify-content-between">
            <h3 class="h6 mb-0">Comments</h3>
            <router-link class="small text-decoration-none" :to="`/artworks/${artwork._id}/comments`">Open comments page</router-link>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="text" class="form-control form-control-sm" placeholder="Write a comment" disabled />
            <button type="button" class="btn btn-sm btn-primary" disabled>Send</button>
          </div>
        </div>
      </div>
    </section>

    <section class="related-shell d-grid gap-2">
      <header class="d-flex align-items-center justify-content-between">
        <h3 class="h6 mb-0">Related works</h3>
      </header>

      <div class="related-grid">
        <router-link
          v-for="item in relatedWorks"
          :key="item._id"
          :to="`/artworks/${item._id}`"
          class="related-card text-decoration-none"
        >
          <img
            v-if="item.images?.[0]"
            class="related-cover"
            :src="item.images[0]"
            :alt="item.title"
            loading="lazy"
          />
          <span class="related-title">{{ item.title }}</span>
        </router-link>
      </div>

      <p v-if="!relatedWorks.length" class="text-secondary small mb-0">No related works yet.</p>
    </section>
  </article>
</template>

<style scoped>
.artwork-detail-template {
  width: 100%;
  max-width: 1040px;
  margin: 0;
}

.post-shell {
  width: min(640px, 100%);
}

.post-card,
.author-card,
.comments-card {
  background: #fff;
}

.main-image {
  max-height: 72vh;
  object-fit: cover;
}

.title {
  line-height: 1.35;
}

.description {
  color: #3d4b63;
  line-height: 1.6;
}

.tag-pill {
  text-decoration: none;
  color: #1f3b7a;
  background: #e8f0ff;
  border: 1px solid #c8d8ff;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
}

.tag-pill:hover {
  background: #d7e5ff;
}

.avatar-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-block;
  background: linear-gradient(135deg, #ffb3b3, #ffd7a8);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.6rem;
}

.related-card {
  display: grid;
  gap: 0.3rem;
}

.related-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 0.6rem;
  border: 1px solid #dbe4f0;
}

.related-title {
  font-size: 0.75rem;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .related-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .related-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
