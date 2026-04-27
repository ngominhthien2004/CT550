<script setup>
import { computed } from 'vue'

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: 'following',
  },
  previews: {
    type: Array,
    default: () => [],
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
  isFollowing: {
    type: Boolean,
    default: false,
  },
  isToggling: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-follow'])

const avatarSrc = computed(() => props.user?.avatar || DEFAULT_PROFILE_AVATAR)
const displayName = computed(() => props.user?.displayName || props.user?.username || 'Unknown user')
const username = computed(() => props.user?.username || 'member')
const shortBio = computed(() => {
  const bio = String(props.user?.bio || '').trim()
  if (!bio) {
    return 'This creator has not added a short bio yet.'
  }

  return bio.length > 92 ? `${bio.slice(0, 92)}...` : bio
})

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}

function toggleFollow() {
  emit('toggle-follow', props.user?._id)
}
</script>

<template>
  <article class="follow-user-card">
    <header class="user-head">
      <div class="identity-wrap">
        <img :src="avatarSrc" :alt="displayName" class="avatar" @error="handleAvatarError" />
        <div class="identity-text">
          <h3>{{ displayName }}</h3>
          <p>@{{ username }}</p>
          <p class="bio">{{ shortBio }}</p>
        </div>
      </div>

      <div class="action-wrap">
        <button
          type="button"
          class="follow-btn"
          :class="{ 'is-following': props.isFollowing }"
          :disabled="props.isToggling"
          @click="toggleFollow"
        >
          {{ props.isFollowing ? 'Following' : 'Follow' }}
        </button>
      </div>
    </header>

    <div v-if="props.mode === 'following'" class="preview-grid">
      <router-link
        v-for="item in props.previews"
        :key="item._id"
        :to="`/artworks/${item._id}`"
        class="preview-thumb"
      >
        <img v-if="item.image" :src="item.image" :alt="item.title || 'Artwork preview'" loading="lazy" />
        <div v-else class="preview-fallback"></div>
      </router-link>
      <div v-if="!props.previews.length" class="preview-empty">No public previews yet.</div>
    </div>
  </article>
</template>

<style scoped>
.follow-user-card {
  border-top: 1px solid #edf2f7;
  padding-top: 0.9rem;
  display: grid;
  gap: 0.6rem;
}

.user-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.identity-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.52rem;
  min-width: 0;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
  background: #e2e8f0;
}

.identity-text {
  min-width: 0;
}

.identity-text h3 {
  margin: 0;
  font-size: 0.88rem;
  color: #0f172a;
  font-weight: 700;
}

.identity-text p {
  margin: 0.15rem 0 0;
  color: #94a3b8;
  font-size: 0.73rem;
  line-height: 1.35;
}

.identity-text .bio {
  margin-top: 0.25rem;
  color: #64748b;
}

.follow-btn {
  border: none;
  border-radius: 999px;
  background: #1695f0;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.34rem 0.66rem;
  white-space: nowrap;
}

.follow-btn.is-following {
  background: #e5e7eb;
  color: #334155;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
}

.preview-thumb {
  display: block;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  aspect-ratio: 4 / 3;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #cbd5e1, #e2e8f0);
}

.preview-empty {
  grid-column: 1 / -1;
  border-radius: 8px;
  border: 1px dashed #dbe4ee;
  color: #64748b;
  font-size: 0.74rem;
  padding: 0.48rem 0.56rem;
  background: #f8fafc;
}

@media (max-width: 920px) {
  .preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
