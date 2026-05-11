<script setup>
import ProfileCoverBanner from '../profile/ProfileCoverBanner.vue'
import ProfileSummarySection from '../profile/ProfileSummarySection.vue'
import ProfilePrimaryTabs from '../profile/ProfilePrimaryTabs.vue'
import ProfileWorksSection from '../profile/ProfileWorksSection.vue'
import ProfileBookmarksSection from '../profile/ProfileBookmarksSection.vue'
import ProfileLikesSection from '../profile/ProfileLikesSection.vue'
import ProfileRequestsSection from '../profile/ProfileRequestsSection.vue'
import ProfileCoverModal from '../profile/ProfileCoverModal.vue'
import ProfileEditModal from '../profile/ProfileEditModal.vue'
import ProfileAvatarModal from '../profile/ProfileAvatarModal.vue'

defineProps({
  user: { type: Object, required: true },
  profileCoverImage: { type: String, default: '' },
  isOwnProfile: { type: Boolean, default: false },
  followingCount: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  profileLocation: { type: String, default: '' },
  isFollowingProfile: { type: Boolean, default: false },
  followLoading: { type: Boolean, default: false },
  followError: { type: String, default: '' },
  artworksCount: { type: Number, default: 0 },
  isAcceptingRequests: { type: Boolean, default: false },
  profileLoading: { type: Boolean, default: false },
  profileError: { type: String, default: '' },
  activeMainTab: { type: String, default: 'home' },
  typeTabs: { type: Array, default: () => [] },
  activeType: { type: String, default: '' },
  visibleArtworks: { type: Array, default: () => [] },
  loadingArtworks: { type: Boolean, default: false },
  artworksError: { type: String, default: '' },
  bookmarkTypeTabs: { type: Array, default: () => [] },
  activeBookmarkType: { type: String, default: '' },
  visibleBookmarks: { type: Array, default: () => [] },
  bookmarkLoading: { type: Boolean, default: false },
  bookmarkError: { type: String, default: '' },
  likeTypeTabs: { type: Array, default: () => [] },
  activeLikeType: { type: String, default: '' },
  visibleLikes: { type: Array, default: () => [] },
  likeLoading: { type: Boolean, default: false },
  likeError: { type: String, default: '' },
  requestTerms: { type: Array, default: () => [] },
  requestTermsLoading: { type: Boolean, default: false },
  requestTermsError: { type: String, default: '' },
  showEditModal: { type: Boolean, default: false },
  showCoverModal: { type: Boolean, default: false },
  showAvatarModal: { type: Boolean, default: false },
})

const emit = defineEmits([
  'edit-cover',
  'delete-cover',
  'toggle-follow',
  'edit-profile',
  'edit-avatar',
  'open-requests',
  'select-main-tab',
  'select-type',
  'show-all-works',
  'select-bookmark-type',
  'select-like-type',
  'close-avatar',
  'close-cover',
  'close-edit',
  'save-avatar',
  'save-cover',
  'save-profile',
])
</script>

<template>
  <section class="profile-page page-block">
    <ProfileCoverBanner
      :user="user"
      :cover-image="profileCoverImage"
      :is-own-profile="isOwnProfile"
      @edit-cover="emit('edit-cover')"
      @delete-cover="emit('delete-cover')"
    />

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
        :artwork-count="artworksCount"
        :is-accepting-requests="isAcceptingRequests"
        @toggle-follow="emit('toggle-follow')"
        @edit-profile="emit('edit-profile')"
        @edit-avatar="emit('edit-avatar')"
        @open-requests="emit('open-requests')"
      />
      <p v-if="profileLoading" class="text-secondary mb-1">Loading profile...</p>
      <p v-if="profileError" class="text-danger mb-1">{{ profileError }}</p>
      <ProfilePrimaryTabs :active-tab="activeMainTab" @select="emit('select-main-tab', $event)" />

      <ProfileWorksSection
        v-if="activeMainTab === 'home'"
        heading="Illustrations and Manga"
        :show-featured="true"
        :tabs="typeTabs"
        :active-type="activeType"
        :artworks="visibleArtworks"
        :loading="loadingArtworks"
        :error="artworksError"
        @select-type="emit('select-type', $event)"
        @show-all="emit('show-all-works')"
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
        @select-type="emit('select-type', $event)"
      />

      <ProfileBookmarksSection
        v-else-if="activeMainTab === 'bookmarks' && isOwnProfile"
        :tabs="bookmarkTypeTabs"
        :active-type="activeBookmarkType"
        :bookmarks="visibleBookmarks"
        :loading="bookmarkLoading"
        :error="bookmarkError"
        @select-type="emit('select-bookmark-type', $event)"
      />

      <ProfileLikesSection
        v-else-if="activeMainTab === 'likes' && isOwnProfile"
        :tabs="likeTypeTabs"
        :active-type="activeLikeType"
        :likes="visibleLikes"
        :loading="likeLoading"
        :error="likeError"
        @select-type="emit('select-like-type', $event)"
      />

      <ProfileRequestsSection
        v-else-if="activeMainTab === 'requests'"
        :terms="requestTerms"
        :creator="user"
        :is-own-profile="isOwnProfile"
        :loading="requestTermsLoading"
        :error="requestTermsError"
      />

      <section v-else-if="(activeMainTab === 'bookmarks' || activeMainTab === 'likes') && !isOwnProfile" class="bookmarks-placeholder">
        This list is only available on your own profile.
      </section>
    </div>
    <Teleport to="body">
      <ProfileAvatarModal
        :show="showAvatarModal"
        :user="user"
        @close="emit('close-avatar')"
        @save="emit('save-avatar', $event)"
      />
      <ProfileCoverModal
        :show="showCoverModal"
        :user="user"
        :cover-image="profileCoverImage"
        @close="emit('close-cover')"
        @save="emit('save-cover', $event)"
      />
      <ProfileEditModal
        :show="showEditModal"
        :user="user"
        @close="emit('close-edit')"
        @save="emit('save-profile', $event)"
      />
    </Teleport>
  </section>
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
