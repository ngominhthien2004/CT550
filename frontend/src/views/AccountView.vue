<script setup>
import { provide } from 'vue'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { AccountProfileSection, AccountLoggedOutPrompt } from '@/components/account'
import { useProfilePage } from '../composables/useProfilePage'
import { toggleNavCollapsed } from '../utils/viewNavigation'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const isNavCollapsed = ref(true)
const router = useRouter()

const state = useProfilePage()

provide('profileUser', state.user)
provide('isOwnProfile', state.isOwnProfile)
provide('profileCoverImage', state.profileCoverImage)
provide('profileLocation', state.profileLocation)
provide('profileGender', state.profileGender)
provide('profileBirthday', state.profileBirthday)
provide('profileLoading', state.profileLoading)
provide('profileError', state.profileError)
provide('followingCount', state.followingCount)
provide('followersCount', state.followersCount)
provide('isFollowingProfile', state.isFollowingProfile)
provide('followLoading', state.followLoading)
provide('followError', state.followError)
provide('artworksCount', state.artworks)
provide('isAcceptingRequests', state.isAcceptingRequests)
provide('activeMainTab', state.activeMainTab)
provide('typeTabs', state.typeTabs)
provide('activeType', state.activeType)
provide('visibleArtworks', state.visibleArtworks)
provide('loadingArtworks', state.loadingArtworks)
provide('artworksError', state.artworksError)
provide('worksHasMore', state.worksHasMore)
provide('worksLimit', state.worksLimit)
provide('showFeaturedWorks', state.showFeaturedWorks)
provide('bookmarkTypeTabs', state.bookmarkTypeTabs)
provide('activeBookmarkType', state.activeBookmarkType)
provide('visibleBookmarks', state.visibleBookmarks)
provide('bookmarkLoading', state.bookmarkStore.loading)
provide('bookmarkError', state.bookmarkStore.error)
provide('bookmarkHasMore', state.bookmarkHasMore)
provide('bookmarkLimit', state.bookmarkLimit)
provide('likeTypeTabs', state.likeTypeTabs)
provide('activeLikeType', state.activeLikeType)
provide('visibleLikes', state.visibleLikes)
provide('likeLoading', state.likeStore.loading)
provide('likeError', state.likeStore.error)
provide('likeHasMore', state.likeHasMore)
provide('likeLimit', state.likeLimit)
provide('requestTerms', state.requestTerms)
provide('requestTermsLoading', state.requestTermsLoading)
provide('requestTermsError', state.requestTermsError)
provide('profileSeries', state.profileSeries)
provide('profileSeriesLoading', state.profileSeriesLoading)
provide('profileSeriesError', state.profileSeriesError)
provide('showEditModal', state.showEditModal)
provide('showCoverModal', state.showCoverModal)
provide('showAvatarModal', state.showAvatarModal)
provide('selectMainTab', state.selectMainTab)
provide('selectType', state.selectType)
provide('selectBookmarkType', state.selectBookmarkType)
provide('selectLikeType', state.selectLikeType)
provide('showAllWorks', state.showAllWorks)
provide('loadMoreWorks', state.loadMoreWorks)
provide('loadMoreBookmarks', state.loadMoreBookmarks)
provide('loadMoreLikes', state.loadMoreLikes)
provide('toggleFollow', state.toggleFollow)
provide('openRequestsTab', state.openRequestsTab)
provide('openEditModal', () => { state.showEditModal.value = true })
provide('openCoverModal', () => { state.showCoverModal.value = true })
provide('openAvatarModal', () => { state.showAvatarModal.value = true })
provide('closeEditModal', () => { state.showEditModal.value = false })
provide('closeCoverModal', () => { state.showCoverModal.value = false })
provide('closeAvatarModal', () => { state.showAvatarModal.value = false })
provide('saveAvatar', state.handleUpdateAvatar)
provide('saveCover', state.handleUpdateCover)
provide('saveProfile', state.handleUpdateProfile)
provide('deleteCover', state.handleDeleteCover)

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

async function goLogin() {
  await router.push('/login')
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <AccountProfileSection v-if="state.user" />
    <AccountLoggedOutPrompt v-else @go-login="goLogin" />
  </MainLayoutTemplate>
</template>
