<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
})

function getImage(item) {
  if (!item) return ''
  if (item.image) return item.image
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0]
  if (typeof item.images === 'string' && item.images) return item.images
  return ''
}

function getImageCount(item) {
  if (Array.isArray(item?.images)) return item.images.length
  return 0
}
</script>

<template>
  <article class="artwork-card">
    <router-link :to="`/artworks/${item._id}`" class="card-cover-link">
      <img
        v-if="getImage(item)"
        :src="getImage(item)"
        :alt="item.title"
        loading="lazy"
      />
      <div v-else class="card-placeholder"></div>

      <!-- Multi-image badge -->
      <span v-if="getImageCount(item) > 1" class="badge-count">
        <i class="fa-regular fa-clone"></i> {{ getImageCount(item) }}
      </span>

      <!-- Like button -->
      <button class="btn-like" aria-label="Like" @click.prevent>
        <i class="fa-regular fa-heart"></i>
      </button>
    </router-link>

    <div class="card-meta">
      <router-link :to="`/artworks/${item._id}`" class="card-title">
        {{ item.title }}
      </router-link>
      <router-link
        v-if="item.user?._id"
        :to="`/users/${item.user._id}/profile`"
        class="card-author"
      >
        <img
          :src="item.user?.avatar || ''"
          class="author-avatar"
          :alt="item.user?.displayName || item.user?.username"
          @error="(e) => (e.target.style.display = 'none')"
        />
        <span>{{ item.user?.displayName || item.user?.username }}</span>
      </router-link>
    </div>
  </article>
</template>

<style scoped>
.artwork-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* ─── Thumbnail link ─── */
.card-cover-link {
  display: block;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f4f4f5;
  text-decoration: none;
}

.card-cover-link img {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.card-cover-link:hover img {
  transform: scale(1.05);
}

/* Placeholder when no image */
.card-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #e4e4e7, #f4f4f5);
}

/* Badges / overlays */
.badge-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-like {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.88);
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  font-size: 14px;
}

.card-cover-link:hover .btn-like {
  opacity: 1;
}

.btn-like:hover {
  color: #ef4444;
  background: #fff;
}

/* ─── Meta (title + author) ─── */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #18181b;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.card-title:hover {
  text-decoration: underline;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: #71717a;
  font-size: 0.78rem;
  min-width: 0;
}

.card-author:hover {
  color: #0096fa;
}

.author-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #d4d4d8;
}

.card-author span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
