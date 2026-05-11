<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import AccountProfileSection from '../components/account/AccountProfileSection.vue'
import AccountLoggedOutPrompt from '../components/account/AccountLoggedOutPrompt.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { useBookmarkStore } from '../stores/bookmark.store'
import { useLikeStore } from '../stores/like.store'
import { useFollowStore } from '../stores/follow.store'
import { useRequestStore } from '../stores/request.store'
import { getArtworks, userApi } from '../services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const bookmarkStore = useBookmarkStore()
const likeStore = useLikeStore()
const followStore = useFollowStore()
const requestStore = useRequestStore()
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
const requestTerms = ref([])
const requestTermsLoading = ref(false)
const requestTermsError = ref('')
const showEditModal = ref(false)
const showCoverModal = ref(false)
const showAvatarModal = ref(false)

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
const isAcceptingRequests = computed(() => requestTerms.value.some((term) => term.isOpen))

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

function openRequestsTab() {
  if (isOwnProfile.value) {
    router.push('/requests/manage')
    return
  }

  activeMainTab.value = 'requests'
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

async function loadRequestTerms() {
  if (!viewingUserId.value) {
    requestTerms.value = []
    return
  }

  requestTermsLoading.value = true
  requestTermsError.value = ''

  try {
    const data = await requestStore.fetchTerms({ creator: viewingUserId.value, openOnly: isOwnProfile.value ? 'false' : 'true' })
    requestTerms.value = Array.isArray(data) ? data : requestStore.terms
  } catch (error) {
    requestTermsError.value = error?.response?.data?.message || 'Failed to load request plans'
    requestTerms.value = []
  } finally {
    requestTermsLoading.value = false
  }
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
async function submitProfileUpdate(formData, { requiredField, modalRef, successMsg }) {
  try {
    if (requiredField && !formData?.has?.(requiredField)) {
      modalRef.value = false
      return
    }

    const { data } = await userApi.updateProfile(formData)

    if (profileUser.value) {
      profileUser.value = { ...profileUser.value, ...data }
    }

    if (isOwnProfile.value) {
      authStore.user = { ...authStore.user, ...data }
      localStorage.setItem('authUser', JSON.stringify(authStore.user))
    }

    modalRef.value = false
    alert(successMsg)
  } catch (err) {
    alert(err?.response?.data?.message || 'Update failed')
  }
}

const handleUpdateProfile = (fd) =>
  submitProfileUpdate(fd, { modalRef: showEditModal, successMsg: 'Profile updated successfully!' })

const handleUpdateCover = (fd) =>
  submitProfileUpdate(fd, { requiredField: 'coverImage', modalRef: showCoverModal, successMsg: 'Cover updated successfully!' })

const handleUpdateAvatar = (fd) =>
  submitProfileUpdate(fd, { requiredField: 'avatar', modalRef: showAvatarModal, successMsg: 'Avatar updated successfully!' })

async function handleDeleteCover() {
  if (!isOwnProfile.value) {
    return
  }

  const confirmed = window.confirm('Remove your cover image?')
  if (!confirmed) {
    return
  }

  try {
    const { data } = await userApi.deleteCover()

    if (profileUser.value) {
      profileUser.value = { ...profileUser.value, ...data, coverImage: data.coverImage || '' }
    }

    if (isOwnProfile.value) {
      authStore.user = { ...authStore.user, ...data, coverImage: data.coverImage || '' }
      localStorage.setItem('authUser', JSON.stringify(authStore.user))
    }
  } catch (error) {
    alert(error?.response?.data?.message || 'Failed to remove cover image')
  }
}


async function goLogin() {
  await router.push('/login')
}

onMounted(() => {
  if (route.query.tab === 'likes') {
    activeMainTab.value = 'likes'
  } else if (route.query.tab === 'bookmarks') {
    activeMainTab.value = 'bookmarks'
  } else if (route.query.tab === 'requests') {
    activeMainTab.value = 'requests'
  }

  loadProfile()
  loadUserArtworks()
  loadBookmarks()
  loadLikes()
  loadFollowStats()
  loadRequestTerms()
})

watch(
  () => viewingUserId.value,
  () => {
    loadProfile()
    loadUserArtworks()
    loadBookmarks()
    loadLikes()
    loadFollowStats()
    loadRequestTerms()
  },
)

watch(showEditModal, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <AccountProfileSection
      v-if="user"
      :user="user"
      :profile-cover-image="profileCoverImage"
      :is-own-profile="isOwnProfile"
      :following-count="followingCount"
      :followers-count="followersCount"
      :profile-location="profileLocation"
      :is-following-profile="isFollowingProfile"
      :follow-loading="followLoading"
      :follow-error="followError"
      :artworks-count="artworks.length"
      :is-accepting-requests="isAcceptingRequests"
      :profile-loading="profileLoading"
      :profile-error="profileError"
      :active-main-tab="activeMainTab"
      :type-tabs="typeTabs"
      :active-type="activeType"
      :visible-artworks="visibleArtworks"
      :loading-artworks="loadingArtworks"
      :artworks-error="artworksError"
      :bookmark-type-tabs="bookmarkTypeTabs"
      :active-bookmark-type="activeBookmarkType"
      :visible-bookmarks="visibleBookmarks"
      :bookmark-loading="bookmarkStore.loading"
      :bookmark-error="bookmarkStore.error"
      :like-type-tabs="likeTypeTabs"
      :active-like-type="activeLikeType"
      :visible-likes="visibleLikes"
      :like-loading="likeStore.loading"
      :like-error="likeStore.error"
      :request-terms="requestTerms"
      :request-terms-loading="requestTermsLoading"
      :request-terms-error="requestTermsError"
      :show-avatar-modal="showAvatarModal"
      :show-cover-modal="showCoverModal"
      :show-edit-modal="showEditModal"
      @edit-cover="showCoverModal = true"
      @delete-cover="handleDeleteCover"
      @toggle-follow="toggleFollow"
      @edit-profile="showEditModal = true"
      @edit-avatar="showAvatarModal = true"
      @open-requests="openRequestsTab"
      @select-main-tab="selectMainTab"
      @select-type="selectType"
      @show-all-works="showAllWorks"
      @select-bookmark-type="selectBookmarkType"
      @select-like-type="selectLikeType"
      @close-avatar="showAvatarModal = false"
      @close-cover="showCoverModal = false"
      @close-edit="showEditModal = false"
      @save-avatar="handleUpdateAvatar"
      @save-cover="handleUpdateCover"
      @save-profile="handleUpdateProfile"
    />

    <AccountLoggedOutPrompt v-else @go-login="goLogin" />
  </MainLayoutTemplate>
</template>
