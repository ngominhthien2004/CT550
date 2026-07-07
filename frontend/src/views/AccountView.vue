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
provide('showDeleteCoverConfirm', state.showDeleteCoverConfirm)
provide('confirmDeleteCoverAction', state.confirmDeleteCoverAction)

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

    <!-- Delete Cover Confirmation Modal -->
    <Teleport to="body">
      <div v-if="state.showDeleteCoverConfirm.value" class="confirm-overlay" @click.self="state.showDeleteCoverConfirm.value = false" @keydown.esc="state.showDeleteCoverConfirm.value = false" tabindex="0" role="dialog" aria-modal="true">
        <div class="confirm-modal">
          <div class="confirm-header">
            <h3>Xóa ảnh bìa</h3>
          </div>
          <div class="confirm-body">
            <p>Bạn có chắc chắn muốn xóa ảnh bìa hồ sơ?</p>
          </div>
          <div class="confirm-footer">
            <button type="button" class="confirm-btn cancel" @click="state.showDeleteCoverConfirm.value = false">Hủy</button>
            <button type="button" class="confirm-btn danger" @click="state.confirmDeleteCoverAction()">Xóa</button>
          </div>
        </div>
      </div>
    </Teleport>
  </MainLayoutTemplate>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.confirm-modal {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.confirm-header h3 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: var(--text);
}
.confirm-body p {
  margin: 0 0 1.25rem;
  color: var(--muted);
  font-size: 0.9rem;
}
.confirm-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.confirm-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.confirm-btn.cancel {
  background: var(--surface-alt);
  color: var(--text);
}
.confirm-btn.danger {
  background: var(--danger);
  color: #fff;
}
</style>
