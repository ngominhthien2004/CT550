<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import FollowUserCard from '../components/follow/FollowUserCard.vue'
import { navItems } from '../constants/navigation'
import { getArtworks, userApi } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import { useFollowStore } from '../stores/follow.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const followStore = useFollowStore()

const isNavCollapsed = ref(true)
const loading = ref(false)
const error = ref('')
const profileLoading = ref(false)
const profileUser = ref(null)
const allArtworks = ref([])

const mode = computed(() => (route.name === 'followers' ? 'followers' : 'following'))
const pageTitle = computed(() => (mode.value === 'followers' ? 'Followers' : 'Following'))
const routeUserId = computed(() => String(route.params.id || authStore.user?._id || ''))

const tabs = computed(() => {
  const userId = routeUserId.value
  return [
    { key: 'following', label: 'Following', to: `/users/${userId}/following` },
    { key: 'mypixiv', label: 'My pixiv', to: '#' },
    { key: 'followers', label: 'Followers', to: `/users/${userId}/followers` },
  ]
})

const targetUsers = computed(() => {
  const list = mode.value === 'followers' ? followStore.followers : followStore.following

  return list
    .map((entry) => {
      const user = mode.value === 'followers' ? entry.follower : entry.following
      if (!user?._id) {
        return null
      }

      return {
        _id: user._id,
        username: user.username || '',
        displayName: user.displayName || user.username || 'Unknown user',
        avatar: user.avatar || '',
      }
    })
    .filter(Boolean)
})

const usersWithPreview = computed(() => {
  const grouped = new Map()

  allArtworks.value.forEach((item) => {
    const userId = item?.user?._id
    if (!userId) {
      return
    }

    const bucket = grouped.get(userId) || []
    if (bucket.length < 4) {
      bucket.push({
        _id: item._id,
        title: item.title || '',
        image: item.images?.[0] || '',
      })
    }
    grouped.set(userId, bucket)
  })

  return targetUsers.value.map((user) => ({
    ...user,
    previews: grouped.get(user._id) || [],
  }))
})

const visibleUsers = computed(() => usersWithPreview.value)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadProfileUser() {
  if (!routeUserId.value) {
    profileUser.value = null
    return
  }

  profileLoading.value = true

  try {
    const { data } = await userApi.getProfile(routeUserId.value)
    profileUser.value = data || null
  } catch (_error) {
    profileUser.value = null
  } finally {
    profileLoading.value = false
  }
}

async function loadFollowUsers() {
  if (!routeUserId.value) {
    error.value = 'Missing user id'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'followers') {
      await followStore.fetchFollowers(routeUserId.value)
    } else {
      await followStore.fetchFollowing(routeUserId.value)
    }

    const { data } = await getArtworks({ limit: 220 })
    allArtworks.value = Array.isArray(data) ? data : []

    if (authStore.isAuthenticated) {
      await Promise.all(
        targetUsers.value.map((item) => followStore.fetchFollowStatus(item._id).catch(() => null)),
      )
    }
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load follow users'
  } finally {
    loading.value = false
  }
}

async function handleToggleFollow(userId) {
  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  await followStore.toggleFollowByUser(userId)
}

onMounted(async () => {
  await loadProfileUser()
  await loadFollowUsers()
})

watch(
  () => [route.params.id, route.name],
  async () => {
    await loadProfileUser()
    await loadFollowUsers()
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="follow-users-page page-block">
      <div class="profile-hero">
        <button type="button" class="hero-edit" aria-label="Edit profile cover">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
        <p v-if="profileLoading" class="hero-hint">Loading profile...</p>
        <p v-else class="hero-hint">Choose a cover and customize your profile!</p>
      </div>

      <div class="follow-content">
        <header class="follow-header">
          <router-link :to="`/account?user=${routeUserId}`" class="owner-link">
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            <img :src="profileUser?.avatar || 'https://s.pximg.net/common/images/no_profile.png'" alt="owner avatar" />
            <span>{{ profileUser?.displayName || profileUser?.username || 'Profile' }}</span>
          </router-link>
        </header>

        <nav class="follow-tabs" aria-label="Follow tabs">
          <router-link
            v-for="tab in tabs"
            :key="tab.key"
            class="follow-tab"
            :class="{ active: mode === tab.key, disabled: tab.key === 'mypixiv' }"
            :to="tab.to"
            @click.prevent="tab.key === 'mypixiv'"
          >
            {{ tab.label }}
          </router-link>
        </nav>

        <div class="follow-topline">
          <h2>Users <span>{{ visibleUsers.length }}</span></h2>
          <div class="visibility-chip-wrap">
            <button type="button" class="visibility-chip active">Public</button>
            <button type="button" class="visibility-chip">Private</button>
          </div>
        </div>

        <p v-if="error" class="state-note error">{{ error }}</p>
        <p v-else-if="loading" class="state-note">Loading {{ pageTitle.toLowerCase() }} users...</p>

        <div v-else-if="visibleUsers.length" class="follow-grid">
          <FollowUserCard
            v-for="user in visibleUsers"
            :key="user._id"
            :user="user"
            :mode="mode"
            :previews="user.previews"
            :is-authenticated="authStore.isAuthenticated"
            :is-following="followStore.isFollowingUser(user._id)"
            :is-toggling="followStore.isTogglingFollow(user._id)"
            @toggle-follow="handleToggleFollow"
          />
        </div>
        <p v-else class="state-note">No users found.</p>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.follow-users-page {
  background: #fff;
  overflow: hidden;
}

.profile-hero {
  height: 164px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #f3f4f6, #e5e7eb);
  display: grid;
  place-items: center;
  position: relative;
}

.hero-edit {
  position: absolute;
  right: 1rem;
  bottom: 0.8rem;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: rgba(100, 116, 139, 0.85);
  color: #fff;
}

.hero-hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.86rem;
  font-weight: 600;
}

.follow-content {
  max-width: 1220px;
  margin: 0 auto;
  padding: 0.85rem 1rem 2rem;
}

.follow-header {
  margin-bottom: 0.7rem;
}

.owner-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 700;
}

.owner-link img {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
  background: #cbd5e1;
}

.follow-tabs {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0.85rem;
}

.follow-tab {
  text-decoration: none;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.55rem 0.15rem;
  border-bottom: 3px solid transparent;
}

.follow-tab.active {
  color: #0f172a;
  border-bottom-color: #1695f0;
}

.follow-tab.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.follow-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.55rem;
}

.follow-topline h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.02rem;
}

.follow-topline h2 span {
  color: #94a3b8;
  font-size: 0.78rem;
  margin-left: 0.2rem;
}

.visibility-chip-wrap {
  display: inline-flex;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.visibility-chip {
  border: none;
  background: #fff;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
}

.visibility-chip.active {
  background: #f8fafc;
  color: #334155;
}

.follow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem 0.9rem;
}

.state-note {
  margin: 0;
  color: #64748b;
}

.state-note.error {
  color: #dc2626;
}

@media (max-width: 1200px) {
  .follow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .follow-content {
    padding: 0.85rem 0.8rem 1.35rem;
  }

  .follow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
