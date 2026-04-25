<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import ProfileCoverBanner from '../components/profile/ProfileCoverBanner.vue'
import ProfileSummarySection from '../components/profile/ProfileSummarySection.vue'
import ProfilePrimaryTabs from '../components/profile/ProfilePrimaryTabs.vue'
import ProfileWorksSection from '../components/profile/ProfileWorksSection.vue'
import ProfileBookmarksSection from '../components/profile/ProfileBookmarksSection.vue'
import ProfileLikesSection from '../components/profile/ProfileLikesSection.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { useBookmarkStore } from '../stores/bookmark.store'
import { useLikeStore } from '../stores/like.store'
import { useFollowStore } from '../stores/follow.store'
import { getArtworks, userApi } from '../services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const bookmarkStore = useBookmarkStore()
const likeStore = useLikeStore()
const followStore = useFollowStore()
const profileUser = ref(null)
const profileLoading = ref(false)
const profileError = ref('')

const profileLocation = computed(() => 'Japan (Private)')
const followingCount = computed(() => followStore.followingCount)
const followersCount = computed(() => followStore.followersCount)
const artworks = ref([])
const loadingArtworks = ref(false)
const artworksError = ref('')
const activeType = ref('')
const activeMainTab = ref('home')
const activeBookmarkType = ref('')
const activeLikeType = ref('')
const followError = ref('')

const queryUserId = computed(() => {
  const id = route.query.user
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) ? id : ''
})

const viewingUserId = computed(() => queryUserId.value || authStore.user?._id || '')
const isOwnProfile = computed(() => {
  if (!viewingUserId.value || !authStore.user?._id) {
    return false
  }

  return authStore.user._id === viewingUserId.value
})

const user = computed(() => {
  if (profileUser.value) {
    return profileUser.value
  }
  return authStore.user
})

const isFollowingProfile = computed(() => {
  if (!viewingUserId.value || isOwnProfile.value) {
    return false
  }
  return followStore.isFollowingUser(viewingUserId.value)
})

const followLoading = computed(() => {
  if (!viewingUserId.value || isOwnProfile.value) {
    return false
  }
  return followStore.isTogglingFollow(viewingUserId.value)
})

const profileCoverImage = computed(() => user.value?.coverImage || artworks.value[0]?.image || '')

const typeLabelMap = {
  illust: 'Illustration',
  manga: 'Manga',
  novel: 'Novel',
  ugoira: 'Ugoira',
}

const typeTabs = computed(() => {
  const bucket = new Map()

  artworks.value.forEach((item) => {
    const type = String(item.type || '').toLowerCase()
    if (!typeLabelMap[type]) {
      return
    }
    bucket.set(type, (bucket.get(type) || 0) + 1)
  })

  return Object.keys(typeLabelMap)
    .filter((type) => bucket.has(type))
    .map((type) => ({
      value: type,
      label: typeLabelMap[type],
      count: bucket.get(type) || 0,
    }))
})

const visibleArtworks = computed(() => {
  if (!activeType.value) {
    return artworks.value
  }
  return artworks.value.filter((item) => String(item.type || '').toLowerCase() === activeType.value)
})

const bookmarkTypeTabs = computed(() => {
  const bucket = new Map()

  bookmarkStore.items.forEach((item) => {
    const type = String(item?.artwork?.type || '').toLowerCase()
    if (!typeLabelMap[type]) {
      return
    }
    bucket.set(type, (bucket.get(type) || 0) + 1)
  })

  return Object.keys(typeLabelMap)
    .filter((type) => bucket.has(type))
    .map((type) => ({
      value: type,
      label: typeLabelMap[type],
      count: bucket.get(type) || 0,
    }))
})

const visibleBookmarks = computed(() => {
  if (!activeBookmarkType.value) {
    return bookmarkStore.items
  }

  return bookmarkStore.items.filter((item) => String(item?.artwork?.type || '').toLowerCase() === activeBookmarkType.value)
})

const likeTypeTabs = computed(() => {
  const bucket = new Map()

  likeStore.items.forEach((item) => {
    const type = String(item?.artwork?.type || '').toLowerCase()
    if (!typeLabelMap[type]) {
      return
    }
    bucket.set(type, (bucket.get(type) || 0) + 1)
  })

  return Object.keys(typeLabelMap)
    .filter((type) => bucket.has(type))
    .map((type) => ({
      value: type,
      label: typeLabelMap[type],
      count: bucket.get(type) || 0,
    }))
})

const visibleLikes = computed(() => {
  if (!activeLikeType.value) {
    return likeStore.items
  }

  return likeStore.items.filter((item) => String(item?.artwork?.type || '').toLowerCase() === activeLikeType.value)
})

function normalizeArtwork(item) {
  return {
    ...item,
    image: item.images?.[0] || '',
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function selectType(type) {
  activeType.value = type
}

function selectBookmarkType(type) {
  activeBookmarkType.value = type
}

function selectLikeType(type) {
  activeLikeType.value = type
}

function selectMainTab(tab) {
  activeMainTab.value = tab
}

function showAllWorks() {
  activeMainTab.value = 'illustrations'
}

async function loadUserArtworks() {
  if (!viewingUserId.value) {
    artworks.value = []
    activeType.value = ''
    return
  }

  loadingArtworks.value = true
  artworksError.value = ''

  try {
    const { data } = await getArtworks({ user: viewingUserId.value, limit: 120 })
    artworks.value = Array.isArray(data) ? data.map(normalizeArtwork) : []
    activeType.value = ''
  } catch (error) {
    artworksError.value = error?.response?.data?.message || 'Failed to load user artworks'
    artworks.value = []
    activeType.value = ''
  } finally {
    loadingArtworks.value = false
  }
}

async function loadBookmarks() {
  if (!isOwnProfile.value || !authStore.user?._id) {
    bookmarkStore.items = []
    activeBookmarkType.value = ''
    return
  }

  await bookmarkStore.fetchMyBookmarks({ limit: 120 })
  activeBookmarkType.value = ''
}

async function loadLikes() {
  if (!isOwnProfile.value || !authStore.user?._id) {
    likeStore.items = []
    activeLikeType.value = ''
    return
  }

  await likeStore.fetchMyLikes({ limit: 120 })
  activeLikeType.value = ''
}

async function loadFollowStats() {
  if (!viewingUserId.value) {
    return
  }

  await Promise.all([
    followStore.fetchFollowing(viewingUserId.value),
    followStore.fetchFollowers(viewingUserId.value),
  ])
}

async function loadProfile() {
  if (!viewingUserId.value) {
    profileUser.value = null
    return
  }

  profileError.value = ''

  if (isOwnProfile.value) {
    profileUser.value = authStore.user
    return
  }

  profileLoading.value = true

  try {
    const { data } = await userApi.getProfile(viewingUserId.value)
    profileUser.value = data || null

    if (authStore.isAuthenticated) {
      await followStore.fetchFollowStatus(viewingUserId.value)
    }
  } catch (error) {
    profileError.value = error?.response?.data?.message || 'Failed to load profile'
    profileUser.value = null
  } finally {
    profileLoading.value = false
  }
}

async function toggleFollow() {
  followError.value = ''

  if (!viewingUserId.value || isOwnProfile.value) {
    return
  }

  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  try {
    await followStore.toggleFollowByUser(viewingUserId.value)
    await loadFollowStats()
  } catch (error) {
    followError.value = error?.response?.data?.message || 'Failed to update follow status'
  }
}

async function goLogin() {
  await router.push('/login')
}

onMounted(() => {
  loadProfile()
  loadUserArtworks()
  loadBookmarks()
  loadLikes()
  loadFollowStats()
})

watch(
  () => viewingUserId.value,
  () => {
    loadProfile()
    loadUserArtworks()
    loadBookmarks()
    loadLikes()
    loadFollowStats()
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="user" class="profile-page page-block">
      <ProfileCoverBanner :user="user" :cover-image="profileCoverImage" :is-own-profile="isOwnProfile" />

      <div class="profile-main">
        <ProfileSummarySection
          :user="user"
          :following-count="followingCount"
          :followers-count="followersCount"
          :profile-location="profileLocation"
          :is-own-profile="isOwnProfile"
          :is-following="isFollowingProfile"
          :follow-loading="followLoading"
          :follow-error="followError"
          :artwork-count="artworks.length"
          @toggle-follow="toggleFollow"
          @edit-profile="router.push('/dashboard')"
        />
        <p v-if="profileLoading" class="text-secondary mb-1">Loading profile...</p>
        <p v-if="profileError" class="text-danger mb-1">{{ profileError }}</p>
        <ProfilePrimaryTabs :active-tab="activeMainTab" @select="selectMainTab" />

        <ProfileWorksSection
          v-if="activeMainTab === 'home'"
          heading="Illustrations and Manga"
          :show-featured="true"
          :tabs="typeTabs"
          :active-type="activeType"
          :artworks="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          @select-type="selectType"
          @show-all="showAllWorks"
        />

        <ProfileWorksSection
          v-else-if="activeMainTab === 'illustrations'"
          heading="All works"
          :show-featured="false"
          :tabs="typeTabs"
          :active-type="activeType"
          :artworks="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          @select-type="selectType"
        />

        <ProfileBookmarksSection
          v-else-if="activeMainTab === 'bookmarks' && isOwnProfile"
          :tabs="bookmarkTypeTabs"
          :active-type="activeBookmarkType"
          :bookmarks="visibleBookmarks"
          :loading="bookmarkStore.loading"
          :error="bookmarkStore.error"
          @select-type="selectBookmarkType"
        />

        <ProfileLikesSection
          v-else-if="activeMainTab === 'likes' && isOwnProfile"
          :tabs="likeTypeTabs"
          :active-type="activeLikeType"
          :likes="visibleLikes"
          :loading="likeStore.loading"
          :error="likeStore.error"
          @select-type="selectLikeType"
        />

        <section v-else-if="(activeMainTab === 'bookmarks' || activeMainTab === 'likes') && !isOwnProfile" class="bookmarks-placeholder">
          This list is only available on your own profile.
        </section>
      </div>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Profile</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.profile-page {
  background: #fff;
  min-height: calc(100vh - 112px);
  overflow: hidden;
}

.profile-main {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.65rem 3.5rem;
  position: relative;
  z-index: 2;
}

.bookmarks-placeholder {
  margin-top: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 1rem 1.1rem;
  color: #64748b;
  background: #fff;
}

@media (max-width: 820px) {
  .profile-main {
    padding: 0 0.9rem 2rem;
  }
}
</style>
