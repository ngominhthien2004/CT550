<script setup>
import { computed, ref, watch } from 'vue'
import { userApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import UserReportModal from '../user/UserReportModal.vue'

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
    default: '',
  },
  profileGender: {
    type: String,
    default: '',
  },
  profileBirthday: {
    type: String,
    default: '',
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
  isAcceptingRequests: {
    type: Boolean,
    default: false,
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

const genderIcon = computed(() => {
  if (props.profileGender === 'male') return 'fa-solid fa-mars'
  if (props.profileGender === 'female') return 'fa-solid fa-venus'
  return ''
})

const genderLabel = computed(() => {
  if (props.profileGender === 'male') return 'Male'
  if (props.profileGender === 'female') return 'Female'
  return ''
})

const emit = defineEmits(['toggle-follow', 'edit-profile', 'edit-avatar', 'open-requests'])

const shareTooltip = ref('')
const authStore = useAuthStore()
const blockedByMe = ref(false)
const blockedMe = ref(false)
const blockLoading = ref(false)
const blockError = ref('')
const showReportModal = ref(false)

async function fetchBlockStatus() {
  if (props.isOwnProfile || !props.user?._id || !authStore.isAuthenticated) {
    return
  }
  try {
    const { data } = await userApi.getBlockStatus(props.user._id)
    blockedByMe.value = data.blockedByMe
    blockedMe.value = data.blockedMe
  } catch {
    // silently fail
  }
}

async function handleBlockToggle() {
  if (!props.user?._id || !authStore.isAuthenticated) return
  blockLoading.value = true
  blockError.value = ''
  try {
    if (blockedByMe.value) {
      await userApi.unblock(props.user._id)
      blockedByMe.value = false
    } else {
      const confirmed = window.confirm(`Block ${props.user.displayName || props.user.username}? You will no longer follow each other.`)
      if (!confirmed) {
        blockLoading.value = false
        return
      }
      await userApi.block(props.user._id)
      blockedByMe.value = true
    }
  } catch (err) {
    blockError.value = err?.response?.data?.message || 'Failed to update block status'
  } finally {
    blockLoading.value = false
  }
}

// Fetch block status when user changes
watch(() => props.user?._id, () => {
  fetchBlockStatus()
}, { immediate: true })

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

const canReportUser = computed(() => {
  if (!authStore.isAuthenticated) return false
  if (props.isOwnProfile) return false
  return true
})

function openReportModal() {
  showReportModal.value = true
}

function closeReportModal() {
  showReportModal.value = false
}
</script>

<template>
  <div class="profile-summary">
    <div class="avatar-shell">
      <div class="avatar-wrap">
        <img :src="avatarSrc" :alt="user.displayName || user.username" @error="handleAvatarError" />
        <div v-if="isOwnProfile" class="avatar-edit-overlay" @click="emit('edit-avatar')" @keydown.enter.prevent="emit('edit-avatar')" @keydown.space.prevent="emit('edit-avatar')" role="button" aria-label="Edit profile picture">
          <i class="fa-solid fa-camera" aria-hidden="true"></i>
        </div>
      </div>
    </div>

    <div class="profile-meta">
      <h1 class="profile-name">{{ user.displayName || user.username }}</h1>
      <p class="profile-handle">@{{ user.username || 'member' }}</p>
      <button
        v-if="isAcceptingRequests"
        type="button"
        class="request-badge"
        @click="emit('open-requests')"
      >
        <i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i>
        Accepting Requests
      </button>

      <div class="profile-stats">
        <router-link :to="`/users/${user._id}/followers`" class="stat-link"><strong>{{ followersCount }}</strong> Followers</router-link>
        <router-link :to="`/users/${user._id}/following`" class="stat-link"><strong>{{ followingCount }}</strong> Following</router-link>
        <span><strong>{{ artworkCount }}</strong> Works</span>
      </div>

      <p class="profile-bio">{{ profileBio }}</p>

      <div class="profile-subtle-row">
        <p class="profile-subtle">
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          {{ profileLocation }}
        </p>
        <p v-if="profileGender" class="profile-subtle">
          <i :class="genderIcon" aria-hidden="true"></i>
          {{ genderLabel }}
        </p>
        <p v-if="profileBirthday" class="profile-subtle">
          <i class="fa-solid fa-cake-candles" aria-hidden="true"></i>
          {{ profileBirthday }}
        </p>
        <button v-if="isOwnProfile" type="button" class="profile-link profile-link-btn" @click="emit('edit-profile')">Change</button>
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
        v-if="isAcceptingRequests"
        type="button"
        class="request-action-btn"
        :aria-label="isOwnProfile ? 'Manage requests' : 'Send request'"
        @click="emit('open-requests')"
      >
        {{ isOwnProfile ? 'Manage Request' : 'Request' }}
      </button>
      <button
        v-else-if="!isOwnProfile"
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
      <button
        v-if="!isOwnProfile && authStore.isAuthenticated"
        type="button"
        class="block-btn"
        :class="{ 'is-blocked': blockedByMe }"
        :disabled="blockLoading"
        :aria-label="blockedByMe ? 'Unblock user' : 'Block user'"
        :title="blockedByMe ? 'Unblock' : 'Block'"
        @click="handleBlockToggle"
      >
        <i v-if="blockLoading" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else :class="blockedByMe ? 'fa-solid fa-ban' : 'fa-regular fa-circle-xmark'"></i>
      </button>
      <div class="share-wrap">
        <button type="button" class="share-btn" aria-label="Share profile" title="Share profile" @click="handleShare">
          <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
        </button>
        <span v-if="shareTooltip" class="share-tooltip">{{ shareTooltip }}</span>
      </div>
      <button
        v-if="canReportUser"
        type="button"
        class="report-user-btn"
        aria-label="Report user"
        title="Report user"
        @click="openReportModal"
      >
        <i class="fa-regular fa-flag" aria-hidden="true"></i>
      </button>
    </div>
      <div v-if="blockedMe" class="blocked-notice">
        <i class="fa-solid fa-ban"></i> You have been blocked by this user.
      </div>

    <!-- Report User Modal -->
    <UserReportModal
      :visible="showReportModal"
      :user="user"
      @close="closeReportModal"
      @reported="closeReportModal"
    />
  </div>
</template>

<style scoped>
.profile-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.1rem;
  align-items: start;
  background: var(--surface);
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
  background: linear-gradient(135deg, var(--surface-alt), var(--line));
  border: 4px solid var(--surface);
  box-shadow: var(--shadow-md);
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

.avatar-edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.avatar-wrap:hover .avatar-edit-overlay {
  opacity: 1;
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
  color: var(--brand);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.profile-handle {
  color: var(--muted);
  font-size: 0.9rem;
}

.profile-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.9rem 1.15rem;
  color: var(--text);
  font-size: 0.92rem;
}

.profile-stats strong {
  font-size: 1rem;
}

.stat-link {
  text-decoration: none;
  color: var(--text);
}

.stat-link:hover,
.stat-link:focus-visible {
  color: var(--accent);
}

.profile-bio {
  max-width: 760px;
  color: var(--text);
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
  color: var(--muted);
  font-size: 0.88rem;
}

.profile-status {
  margin: 0;
  color: var(--muted);
  font-size: 0.84rem;
}

.request-badge {
  width: fit-content;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  padding: 0.38rem 0.66rem;
  font-size: 0.78rem;
  font-weight: 800;
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
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  text-decoration: none;
  font-size: 0.82rem;
}

.social-icon-btn:hover,
.social-icon-btn:focus-visible {
  background: var(--surface-alt);
  color: var(--accent-hover);
}

.profile-error {
  margin: 0;
  color: var(--danger);
  font-size: 0.78rem;
}

.profile-link {
  text-decoration: none;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.profile-link:hover,
.profile-link:focus-visible {
  color: var(--accent);
}

.profile-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
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
  background: var(--surface-alt);
  color: var(--text);
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 700;
}

.request-action-btn {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 800;
}

.follow-profile-btn {
  border-radius: 999px;
  padding: 0.7rem 1.2rem;
  min-width: 106px;
  font-size: 0.88rem;
  font-weight: 700;
}

.follow-profile-btn.is-not-following {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
}

.follow-profile-btn.is-following {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
}

.share-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 1rem;
  cursor: pointer;
}

.message-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 0.95rem;
}

.message-btn:hover,
.message-btn:focus-visible {
  background: var(--surface-alt);
  color: var(--accent-hover);
}

.share-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
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

.block-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 0.95rem;
  cursor: pointer;
}
.block-btn:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}
.block-btn.is-blocked {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #dc2626;
}
.block-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.blocked-notice {
  grid-column: 1 / -1;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.report-user-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 0.95rem;
  cursor: pointer;
}

.report-user-btn:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}
</style>
