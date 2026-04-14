<script setup>
import { computed, ref, toRefs, watch } from 'vue'

defineEmits(['toggle-bookmark', 'toggle-like', 'toggle-follow'])

const props = defineProps({
  artwork: {
    type: Object,
    required: true,
  },
  displayAuthor: {
    type: String,
    default: 'Unknown artist',
  },
  artistId: {
    type: String,
    default: '',
  },
  isOwnArtist: {
    type: Boolean,
    default: false,
  },
  relatedWorks: {
    type: Array,
    default: () => [],
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  isLiked: {
    type: Boolean,
    default: false,
  },
  likeLoading: {
    type: Boolean,
    default: false,
  },
  likeError: {
    type: String,
    default: '',
  },
  isFollowing: {
    type: Boolean,
    default: false,
  },
  followLoading: {
    type: Boolean,
    default: false,
  },
  followError: {
    type: String,
    default: '',
  },
  artistFollowersCount: {
    type: Number,
    default: 0,
  },
  artistFollowingCount: {
    type: Number,
    default: 0,
  },
  bookmarkLoading: {
    type: Boolean,
    default: false,
  },
  bookmarkError: {
    type: String,
    default: '',
  },
})

const {
  artwork,
  displayAuthor,
  artistId,
  isOwnArtist,
  relatedWorks,
  isBookmarked,
  isLiked,
  likeLoading,
  likeError,
  isFollowing,
  followLoading,
  followError,
  artistFollowersCount,
  artistFollowingCount,
  bookmarkLoading,
  bookmarkError,
} = toRefs(props)

const selectedImageIndex = ref(0)

const imageList = computed(() => {
  if (!Array.isArray(artwork.value?.images)) {
    return []
  }

  return artwork.value.images.filter((item) => typeof item === 'string' && item.trim())
})

const mainImage = computed(() => imageList.value[selectedImageIndex.value] || '')

const uploadedAtLabel = computed(() => {
  const createdAt = artwork.value?.createdAt

  if (!createdAt) {
    return ''
  }

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString()
})

function selectImage(index) {
  if (index < 0 || index >= imageList.value.length) {
    return
  }
  selectedImageIndex.value = index
}

watch(
  () => artwork.value?._id,
  () => {
    selectedImageIndex.value = 0
  },
  { immediate: true },
)
</script>

<template>
  <article class="artwork-detail-template d-grid gap-4">
    <section class="post-shell d-grid gap-3">
      <div class="post-card card border-0 shadow-sm">
        <div class="card-body p-3 p-md-4 d-grid gap-3">
          <img
            v-if="mainImage"
            class="img-fluid rounded-3 border w-100 main-image"
            :src="mainImage"
            :alt="artwork.title"
            loading="lazy"
          />

          <div v-if="imageList.length > 1" class="d-grid gap-2">
            <div class="d-flex align-items-center justify-content-between">
              <p class="small text-secondary mb-0">Image {{ selectedImageIndex + 1 }} / {{ imageList.length }}</p>
            </div>
            <div class="thumbnail-strip">
              <button
                v-for="(image, index) in imageList"
                :key="`${artwork._id}-thumb-${index}`"
                type="button"
                class="thumb-button"
                :class="{ active: selectedImageIndex === index }"
                :aria-label="`Open image ${index + 1}`"
                @click="selectImage(index)"
              >
                <img :src="image" :alt="`${artwork.title} thumbnail ${index + 1}`" loading="lazy" />
              </button>
            </div>
          </div>

          <div class="post-actions d-flex align-items-center justify-content-end gap-3">
            <button
              type="button"
              class="btn btn-sm btn-light"
              :class="{ 'like-active': isLiked }"
              :aria-label="isLiked ? 'Remove like' : 'Add like'"
              :title="isLiked ? 'Remove like' : 'Add like'"
              :disabled="likeLoading"
              @click="$emit('toggle-like')"
            >
              <i :class="[isLiked ? 'fa-solid' : 'fa-regular', 'fa-heart']" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="btn btn-sm btn-light"
              :class="{ 'bookmark-active': isBookmarked }"
              :aria-label="isBookmarked ? 'Remove bookmark' : 'Add bookmark'"
              :title="isBookmarked ? 'Remove bookmark' : 'Add bookmark'"
              :disabled="bookmarkLoading"
              @click="$emit('toggle-bookmark')"
            >
              <i :class="[isBookmarked ? 'fa-solid' : 'fa-regular', 'fa-bookmark']" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-sm btn-light" aria-label="More options">
              <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
            </button>
          </div>
          <p v-if="likeError" class="small text-danger mb-0">{{ likeError }}</p>
          <p v-if="bookmarkError" class="small text-danger mb-0">{{ bookmarkError }}</p>

          <div class="d-grid gap-2">
            <h2 class="h5 mb-0 title">{{ artwork.title }}</h2>
            <p class="text-secondary small mb-0">{{ artwork.type }} · {{ artwork.ageRating }}</p>
            <p v-if="uploadedAtLabel" class="text-secondary small mb-0">Posted on {{ uploadedAtLabel }}</p>
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
              <router-link
                v-if="artistId"
                :to="`/account?user=${artistId}`"
                class="mb-0 fw-semibold text-decoration-none text-dark"
              >
                {{ displayAuthor }}
              </router-link>
              <p v-else class="mb-0 fw-semibold">{{ displayAuthor }}</p>
              <p class="mb-0 text-secondary small">{{ isFollowing ? 'Following this artist' : 'Not following yet' }}</p>
              <p class="mb-0 text-secondary x-small">Followers {{ artistFollowersCount }} · Following {{ artistFollowingCount }}</p>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end gap-1">
            <button
              v-if="!isOwnArtist"
              type="button"
              class="btn btn-sm"
              :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary'"
              :disabled="followLoading"
              :aria-label="isFollowing ? 'Unfollow artist' : 'Follow artist'"
              @click="$emit('toggle-follow')"
            >
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
            <router-link
              v-if="artistId"
              :to="`/account?user=${artistId}`"
              class="small text-decoration-none"
            >
              View profile
            </router-link>
            <router-link
              v-if="artistId"
              :to="`/account?user=${artistId}`"
              class="small text-decoration-none"
            >
              View all works
            </router-link>
          </div>
        </div>
        <p v-if="followError" class="small text-danger mb-0 px-3 pb-2">{{ followError }}</p>
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

.thumbnail-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 0.45rem;
}

.thumb-button {
  border: 1px solid #dbe4f0;
  border-radius: 0.5rem;
  padding: 0;
  background: #fff;
  overflow: hidden;
  line-height: 0;
}

.thumb-button img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.thumb-button.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
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

.x-small {
  font-size: 0.72rem;
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

.bookmark-active {
  color: #8f1d39;
  border-color: #d9b2bc;
  background: #ffe9ee;
}

.like-active {
  color: #9f1239;
  border-color: #f6bfd0;
  background: #fff1f5;
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
