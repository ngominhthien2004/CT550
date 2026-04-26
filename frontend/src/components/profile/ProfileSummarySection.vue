<script setup>
import { computed, ref } from 'vue'

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  profileLocation: {
    type: String,
    default: 'Japan (Private)',
  },
  isOwnProfile: {
    type: Boolean,
    default: true,
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
  artworkCount: {
    type: Number,
    default: 0,
  },
})

const avatarSrc = computed(() => props.user?.avatar || DEFAULT_PROFILE_AVATAR)
const profileBio = computed(() => props.user?.bio || (props.isOwnProfile ? 'Curate your cover, avatar, and gallery to give your profile more character.' : 'This creator has not added a bio yet.'))
const socialLinks = computed(() => {
  const links = props.user?.socialLinks || {}
  const rows = [
    {
      key: 'twitter',
      icon: 'fa-brands fa-x-twitter',
      href: links.twitter,
      label: 'X (Twitter)',
    },
    {
      key: 'instagram',
      icon: 'fa-brands fa-instagram',
      href: links.instagram,
      label: 'Instagram',
    },
    {
      key: 'portfolio',
      icon: 'fa-solid fa-globe',
      href: links.portfolio,
      label: 'Portfolio',
    },
  ]

  return rows.filter((item) => typeof item.href === 'string' && item.href.trim())
})

const emit = defineEmits(['toggle-follow', 'edit-profile'])

const shareTooltip = ref('')

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}

async function handleShare() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    shareTooltip.value = 'Link copied!'
    setTimeout(() => { shareTooltip.value = '' }, 2000)
  } catch {
    shareTooltip.value = 'Copy failed'
    setTimeout(() => { shareTooltip.value = '' }, 2000)
  }
}
</script>

<template>
  <div class="profile-summary">
    <div class="avatar-shell">
      <div class="avatar-wrap">
        <img :src="avatarSrc" :alt="user.displayName || user.username" @error="handleAvatarError" />
      </div>
    </div>

    <div class="profile-meta">
      <h1 class="profile-name">{{ user.displayName || user.username }}</h1>
      <p class="profile-handle">@{{ user.username || 'member' }}</p>

      <div class="profile-stats">
        <span><strong>{{ followersCount }}</strong> Followers</span>
        <span><strong>{{ followingCount }}</strong> Following</span>
        <span><strong>{{ artworkCount }}</strong> Works</span>
      </div>

      <p class="profile-bio">{{ profileBio }}</p>

      <div class="profile-subtle-row">
        <p class="profile-subtle">
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          {{ profileLocation }}
        </p>
        <router-link :to="`/account?user=${user._id}`" class="profile-link">View profile</router-link>
        <div v-if="socialLinks.length" class="profile-socials" aria-label="Social media links">
          <a
            v-for="social in socialLinks"
            :key="social.key"
            :href="social.href"
            class="social-icon-btn"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="social.label"
            :title="social.label"
          >
            <i :class="social.icon" aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <p class="profile-status">{{ isOwnProfile ? 'This is your public profile surface.' : isFollowing ? 'You are following this user.' : 'Follow this creator to keep up with new works.' }}</p>
      <p v-if="followError" class="profile-error">{{ followError }}</p>
    </div>

    <div class="profile-actions">
      <button v-if="isOwnProfile" type="button" class="edit-profile-btn" @click="emit('edit-profile')">Edit profile</button>
      <button
        v-else
        type="button"
        class="follow-profile-btn"
        :class="isFollowing ? 'is-following' : 'is-not-following'"
        :disabled="followLoading"
        :aria-label="isFollowing ? 'Unfollow user' : 'Follow user'"
        @click="emit('toggle-follow')"
      >
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>
      <router-link
        v-if="!isOwnProfile"
        :to="`/messages?user=${user._id}`"
        class="message-btn"
        aria-label="Message this user"
        title="Message"
      >
        <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      </router-link>
      <div class="share-wrap">
        <button type="button" class="share-btn" aria-label="Share profile" title="Share profile" @click="handleShare">
          <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
        </button>
        <span v-if="shareTooltip" class="share-tooltip">{{ shareTooltip }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.1rem;
  align-items: start;
  background: #fff;
  padding: 0 0 1.1rem;
}

.avatar-shell {
  position: relative;
  margin-top: -44px;
}

.avatar-wrap {
  width: 94px;
  height: 94px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dbe5ef, #b9c8d6);
  border: 4px solid #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-meta {
  padding-top: 0.8rem;
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: clamp(1.7rem, 1.3rem + 1vw, 2.45rem);
  font-weight: 700;
  color: #1f2937;
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.profile-handle {
  color: #64748b;
  font-size: 0.9rem;
}

.profile-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.9rem 1.15rem;
  color: #334155;
  font-size: 0.92rem;
}

.profile-stats strong {
  font-size: 1rem;
}

.profile-bio {
  max-width: 760px;
  color: #334155;
  font-size: 0.92rem;
  line-height: 1.6;
}

.profile-subtle-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-subtle {
  margin: 0;
  color: #6b7280;
  font-size: 0.88rem;
}

.profile-status {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
}

.profile-socials {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.social-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe4ef;
  background: #fff;
  color: #475569;
  text-decoration: none;
  font-size: 0.82rem;
}

.social-icon-btn:hover,
.social-icon-btn:focus-visible {
  background: #eff6ff;
  color: #2563eb;
}

.profile-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.78rem;
}

.profile-link {
  text-decoration: none;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 600;
}

.profile-link:hover,
.profile-link:focus-visible {
  color: #3b82f6;
}

.profile-actions {
  padding-top: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.edit-profile-btn {
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 700;
}

.follow-profile-btn {
  border-radius: 999px;
  padding: 0.7rem 1.2rem;
  min-width: 106px;
  font-size: 0.88rem;
  font-weight: 700;
}

.follow-profile-btn.is-not-following {
  border: 1px solid #0096fa;
  background: #0096fa;
  color: #fff;
}

.follow-profile-btn.is-following {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
}

.share-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
}

.message-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid #dbe4ef;
  background: #fff;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 0.95rem;
}

.message-btn:hover,
.message-btn:focus-visible {
  background: #eff6ff;
  color: #2563eb;
}

.share-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.share-wrap {
  position: relative;
  display: inline-flex;
}

.share-tooltip {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@media (max-width: 820px) {
  .profile-summary {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  .avatar-shell {
    margin-top: -30px;
  }

  .avatar-wrap {
    width: 82px;
    height: 82px;
  }

  .profile-meta,
  .profile-actions {
    padding-top: 0;
  }

  .profile-actions {
    justify-content: flex-start;
  }
}
</style>
