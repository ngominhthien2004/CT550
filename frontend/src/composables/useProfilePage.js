import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useBookmarkStore } from '../stores/bookmark.store'
import { useLikeStore } from '../stores/like.store'
import { useFollowStore } from '../stores/follow.store'
import { useRequestStore } from '../stores/request.store'
import { getArtworks, getMyBookmarks, getMyLikes, getUserSeries, userApi } from '../services/api'
import { getApiErrorMessage } from '../utils/apiErrors'
import { useToast } from './useToast'

const ARTWORKS_PER_PAGE = 24
const BOOKMARKS_PER_PAGE = 24
const LIKES_PER_PAGE = 24

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function useProfilePage() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const bookmarkStore = useBookmarkStore()
  const likeStore = useLikeStore()
  const followStore = useFollowStore()
  const requestStore = useRequestStore()
  const { showSuccess, showError, showInfo } = useToast()

  const profileUser = ref(null)
  const profileLoading = ref(false)
  const profileError = ref('')
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
  const showDeleteCoverConfirm = ref(false)
  const profileSeries = ref([])
  const profileSeriesLoading = ref(false)
  const profileSeriesError = ref('')
  const showFeaturedWorks = ref(true)

  const artworksPage = ref(1)
  const worksHasMore = ref(true)
  const bookmarkPage = ref(1)
  const bookmarkHasMore = ref(true)
  const likePage = ref(1)
  const likeHasMore = ref(true)

  const queryUserId = computed(() => {
    const id = route.query.user
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) ? id : ''
  })

  const viewingUserId = computed(() => queryUserId.value || authStore.user?._id || '')

  const isOwnProfile = computed(() => {
    if (!viewingUserId.value || !authStore.user?._id) return false
    return authStore.user._id === viewingUserId.value
  })

  const user = computed(() => profileUser.value || authStore.user)

  const isFollowingProfile = computed(() => {
    if (!viewingUserId.value || isOwnProfile.value) return false
    return followStore.isFollowingUser(viewingUserId.value)
  })

  const followLoading = computed(() => {
    if (!viewingUserId.value || isOwnProfile.value) return false
    return followStore.isTogglingFollow(viewingUserId.value)
  })

  const followingCount = computed(() => followStore.followingCount)
  const followersCount = computed(() => followStore.followersCount)

  const profileCoverImage = computed(() => user.value?.coverImage || '')
  const isAcceptingRequests = computed(() => requestTerms.value.some((term) => term.isOpen))

  const profileLocation = computed(() => user.value?.location || '')

  const profileGender = computed(() => {
    const g = user.value?.gender || ''
    return g === 'rather_not_say' ? '' : g
  })

  const profileBirthday = computed(() => {
    const year = user.value?.birthYear
    const month = user.value?.birthdayMonth
    const day = user.value?.birthdayDay
    if (!year && !month && !day) return ''
    const parts = [
      ...(month ? [MONTH_NAMES[month - 1] || ''] : []),
      ...(day ? [String(day)] : []),
      ...(year ? [String(year)] : []),
    ]
    return parts.length ? `Born ${parts.join(' ')}` : ''
  })

  const typeLabelMap = {
    illust: 'Illustration',
    manga: 'Manga',
    novel: 'Novel',
    gif: 'GIF',
  }

  function buildTypeTabs(items, getType) {
    const bucket = new Map()
    items.forEach((item) => {
      const type = getType(item)
      if (!typeLabelMap[type]) return
      bucket.set(type, (bucket.get(type) || 0) + 1)
    })
    return Object.keys(typeLabelMap)
      .filter((type) => bucket.has(type))
      .map((type) => ({ value: type, label: typeLabelMap[type], count: bucket.get(type) || 0 }))
  }

  function filterByType(items, selectedType, getType) {
    if (!selectedType) return items
    return items.filter((item) => getType(item) === selectedType)
  }

  const typeTabs = computed(() =>
    buildTypeTabs(artworks.value, (item) => String(item.type || '').toLowerCase()),
  )

  const visibleArtworks = computed(() =>
    filterByType(artworks.value, activeType.value, (item) => String(item.type || '').toLowerCase()),
  )

  const bookmarkTypeTabs = computed(() =>
    buildTypeTabs(bookmarkStore.items, (item) => String(item?.artwork?.type || '').toLowerCase()),
  )

  const visibleBookmarks = computed(() =>
    filterByType(bookmarkStore.items, activeBookmarkType.value, (item) => String(item?.artwork?.type || '').toLowerCase()),
  )

  const likeTypeTabs = computed(() =>
    buildTypeTabs(likeStore.items, (item) => String(item?.artwork?.type || '').toLowerCase()),
  )

  const visibleLikes = computed(() =>
    filterByType(likeStore.items, activeLikeType.value, (item) => String(item?.artwork?.type || '').toLowerCase()),
  )

  function normalizeArtwork(item) {
    return { ...item, image: item.images?.[0] || '' }
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
    if (tab === 'home') {
      activeType.value = ''
      showFeaturedWorks.value = true
    } else if (tab === 'illustrations') {
      activeType.value = 'illust'
    } else if (tab === 'manga') {
      activeType.value = 'manga'
    } else if (tab === 'novels') {
      activeType.value = 'novel'
    }
  }

  function openRequestsTab() {
    if (isOwnProfile.value) {
      router.push('/requests/manage')
      return
    }
    activeMainTab.value = 'requests'
  }

  function showAllWorks() {
    showFeaturedWorks.value = false
  }

  async function loadUserArtworks(append = false) {
    if (!viewingUserId.value) {
      artworks.value = []
      activeType.value = ''
      return
    }
    loadingArtworks.value = true
    artworksError.value = ''
    if (!append) activeType.value = ''

    try {
      const page = append ? artworksPage.value : 1
      const { data } = await getArtworks({ user: viewingUserId.value, page, limit: ARTWORKS_PER_PAGE })
      const items = Array.isArray(data) ? data.map(normalizeArtwork) : []
      if (append) {
        artworks.value = [...artworks.value, ...items]
        artworksPage.value++
      } else {
        artworks.value = items
        artworksPage.value = 2
      }
      worksHasMore.value = items.length >= ARTWORKS_PER_PAGE
    } catch (error) {
      artworksError.value = getApiErrorMessage(error, 'Failed to load user artworks')
      artworks.value = []
      activeType.value = ''
    } finally {
      loadingArtworks.value = false
    }
  }

  async function loadBookmarks(append = false) {
    if (!isOwnProfile.value || !authStore.user?._id) {
      bookmarkStore.items = []
      activeBookmarkType.value = ''
      return
    }
    bookmarkStore.loading = true
    bookmarkStore.error = ''
    if (!append) activeBookmarkType.value = ''

    try {
      const page = append ? bookmarkPage.value : 1
      const { data } = await getMyBookmarks({ page, limit: BOOKMARKS_PER_PAGE })
      const items = data.bookmarks || []
      if (append) {
        bookmarkStore.items = [...bookmarkStore.items, ...items]
        bookmarkPage.value++
      } else {
        bookmarkStore.items = items
        bookmarkPage.value = 2
      }
      bookmarkHasMore.value = items.length >= BOOKMARKS_PER_PAGE
    } catch (error) {
      bookmarkStore.error = getApiErrorMessage(error, 'Failed to load bookmarks')
      if (!append) bookmarkStore.items = []
    } finally {
      bookmarkStore.loading = false
    }
  }

  async function loadLikes(append = false) {
    if (!isOwnProfile.value || !authStore.user?._id) {
      likeStore.items = []
      activeLikeType.value = ''
      return
    }
    likeStore.loading = true
    likeStore.error = ''
    if (!append) activeLikeType.value = ''

    try {
      const page = append ? likePage.value : 1
      const { data } = await getMyLikes({ page, limit: LIKES_PER_PAGE })
      const items = data.likes || []
      items.forEach((item) => {
        const artworkId = item?.artwork?._id || item?.artwork
        if (artworkId) likeStore.statusByArtwork[artworkId] = true
      })
      if (append) {
        likeStore.items = [...likeStore.items, ...items]
        likePage.value++
      } else {
        likeStore.items = items
        likePage.value = 2
      }
      likeHasMore.value = items.length >= LIKES_PER_PAGE
    } catch (error) {
      likeStore.error = getApiErrorMessage(error, 'Failed to load likes')
      if (!append) likeStore.items = []
    } finally {
      likeStore.loading = false
    }
  }

  function loadMoreWorks() {
    if (!loadingArtworks.value && worksHasMore.value) loadUserArtworks(true)
  }

  function loadMoreBookmarks() {
    if (!bookmarkStore.loading && bookmarkHasMore.value) loadBookmarks(true)
  }

  function loadMoreLikes() {
    if (!likeStore.loading && likeHasMore.value) loadLikes(true)
  }

  async function loadFollowStats() {
    if (!viewingUserId.value) return
    await Promise.all([
      followStore.fetchFollowing(viewingUserId.value),
      followStore.fetchFollowers(viewingUserId.value),
    ])
  }

  async function loadSeries() {
    if (!viewingUserId.value) {
      profileSeries.value = []
      return
    }
    profileSeriesLoading.value = true
    profileSeriesError.value = ''
    try {
      const { data } = await getUserSeries(viewingUserId.value)
      profileSeries.value = Array.isArray(data) ? data : []
    } catch (err) {
      profileSeriesError.value = err?.response?.data?.message || 'Failed to load series'
      profileSeries.value = []
    } finally {
      profileSeriesLoading.value = false
    }
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
      requestTermsError.value = getApiErrorMessage(error, 'Failed to load request plans')
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
      profileError.value = getApiErrorMessage(error, 'Failed to load profile')
      profileUser.value = null
    } finally {
      profileLoading.value = false
    }
  }

  async function toggleFollow() {
    followError.value = ''
    if (!viewingUserId.value || isOwnProfile.value) return
    if (!authStore.isAuthenticated) {
      await router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }
    try {
      await followStore.toggleFollowByUser(viewingUserId.value)
      await loadFollowStats()
    } catch (error) {
      followError.value = getApiErrorMessage(error, 'Failed to update follow status')
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
        Object.assign(profileUser.value, data)
      }
      if (isOwnProfile.value) {
        Object.assign(authStore.user, data)
        localStorage.setItem('authUser', JSON.stringify(authStore.user))
      }
      modalRef.value = false
      showSuccess(successMsg)
    } catch (err) {
      showError(getApiErrorMessage(err, 'Update failed'))
    }
  }

  const handleUpdateProfile = (fd) =>
    submitProfileUpdate(fd, { modalRef: showEditModal, successMsg: 'Profile updated successfully!' })

  const handleUpdateCover = (fd) =>
    submitProfileUpdate(fd, { requiredField: 'coverImage', modalRef: showCoverModal, successMsg: 'Cover updated successfully!' })

  const handleUpdateAvatar = (fd) =>
    submitProfileUpdate(fd, { requiredField: 'avatar', modalRef: showAvatarModal, successMsg: 'Avatar updated successfully!' })

  async function confirmDeleteCoverAction() {
    if (!isOwnProfile.value) return
    showDeleteCoverConfirm.value = false
    try {
      const { data } = await userApi.deleteCover()
      if (profileUser.value) {
        profileUser.value = { ...profileUser.value, ...data, coverImage: data.coverImage || '' }
      }
      if (isOwnProfile.value) {
        authStore.user = { ...authStore.user, ...data, coverImage: data.coverImage || '' }
        localStorage.setItem('authUser', JSON.stringify(authStore.user))
      }
      showSuccess('Cover image removed successfully.')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Failed to remove cover image'))
    }
  }

  function setActiveTabFromRoute() {
    if (route.query.tab === 'likes') {
      activeMainTab.value = 'likes'
    } else if (route.query.tab === 'bookmarks') {
      activeMainTab.value = 'bookmarks'
    } else if (route.query.tab === 'requests') {
      activeMainTab.value = 'requests'
    }
  }

  function loadAllProfileData() {
    loadProfile()
    loadUserArtworks()
    loadBookmarks()
    loadLikes()
    loadFollowStats()
    loadRequestTerms()
    loadSeries()
  }

  onMounted(() => {
    setActiveTabFromRoute()
    loadAllProfileData()
  })

  watch(() => viewingUserId.value, () => {
    loadAllProfileData()
  })

  function syncBodyOverflow(val) {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  watch(showEditModal, syncBodyOverflow)
  watch(showCoverModal, syncBodyOverflow)
  watch(showAvatarModal, syncBodyOverflow)

  onUnmounted(() => {
    document.body.style.overflow = ''
  })

  return {
    user,
    profileUser,
    profileLoading,
    profileError,
    profileCoverImage,
    profileLocation,
    profileGender,
    profileBirthday,
    isOwnProfile,
    viewingUserId,
    followingCount,
    followersCount,
    isFollowingProfile,
    followLoading,
    followError,
    artworks,
    loadingArtworks,
    artworksError,
    activeType,
    activeMainTab,
    typeTabs,
    visibleArtworks,
    showFeaturedWorks,
    worksHasMore,
    worksLimit: ARTWORKS_PER_PAGE,
    bookmarkTypeTabs,
    activeBookmarkType,
    visibleBookmarks,
    bookmarkHasMore,
    bookmarkLimit: BOOKMARKS_PER_PAGE,
    likeTypeTabs,
    activeLikeType,
    visibleLikes,
    likeHasMore,
    likeLimit: LIKES_PER_PAGE,
    requestTerms,
    requestTermsLoading,
    requestTermsError,
    isAcceptingRequests,
    profileSeries,
    profileSeriesLoading,
    profileSeriesError,
    showEditModal,
    showCoverModal,
    showAvatarModal,
    selectMainTab,
    selectType,
    selectBookmarkType,
    selectLikeType,
    showAllWorks,
    loadMoreWorks,
    loadMoreBookmarks,
    loadMoreLikes,
    toggleFollow,
    openRequestsTab,
    handleUpdateProfile,
    handleUpdateCover,
    handleUpdateAvatar,
    handleDeleteCover: () => { showDeleteCoverConfirm.value = true },
    showDeleteCoverConfirm,
    confirmDeleteCoverAction,
    bookmarkStore,
    likeStore,
  }
}
