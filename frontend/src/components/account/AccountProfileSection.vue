<script setup>
import { computed } from 'vue'
import ProfileCoverBanner from '../profile/ProfileCoverBanner.vue'
import ProfileSummarySection from '../profile/ProfileSummarySection.vue'
import ProfilePrimaryTabs from '../profile/ProfilePrimaryTabs.vue'
import ArtworkGridSection from '../profile/ArtworkGridSection.vue'
import ProfileRequestsSection from '../profile/ProfileRequestsSection.vue'
import ProfileSeriesSection from '../profile/ProfileSeriesSection.vue'
import ProfileCoverModal from '../profile/ProfileCoverModal.vue'
import ProfileEditModal from '../profile/ProfileEditModal.vue'
import ProfileAvatarModal from '../profile/ProfileAvatarModal.vue'

const props = defineProps({
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
  worksHasMore: { type: Boolean, default: false },
  worksLimit: { type: Number, default: 24 },
  bookmarkHasMore: { type: Boolean, default: false },
  bookmarkLimit: { type: Number, default: 24 },
  likeHasMore: { type: Boolean, default: false },
  likeLimit: { type: Number, default: 24 },
  profileSeries: { type: Array, default: () => [] },
  profileSeriesLoading: { type: Boolean, default: false },
  profileSeriesError: { type: String, default: '' },
  showFeaturedWorks: { type: Boolean, default: true },
  showIllustSeries: { type: Boolean, default: true },
  showMangaSeries: { type: Boolean, default: true },
  showNovelSeries: { type: Boolean, default: true },
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
  'load-more-works',
  'load-more-bookmarks',
  'load-more-likes',
])

const profileGender = computed(() => {
  const g = props.user?.gender || ''
  return g === 'rather_not_say' ? '' : g
})

const profileBirthday = computed(() => {
  const year = props.user?.birthYear
  const month = props.user?.birthdayMonth
  const day = props.user?.birthdayDay
  if (!year && !month && !day) return ''
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const parts = [
    ...(month ? [monthNames[month - 1] || ''] : []),
    ...(day ? [String(day)] : []),
    ...(year ? [String(year)] : []),
  ]
  return parts.length ? `Born ${parts.join(' ')}` : ''
})
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
        :profile-gender="profileGender"
        :profile-birthday="profileBirthday"
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
      <ProfilePrimaryTabs :active-tab="activeMainTab" :is-own-profile="isOwnProfile" @select="emit('select-main-tab', $event)" />

      <!-- ════ HOME TAB ════ -->
      <template v-if="activeMainTab === 'home'">
        <ProfileSeriesSection
          :series="profileSeries"
          :loading="profileSeriesLoading"
          :error="profileSeriesError"
        />
        <ArtworkGridSection
          heading="Illustrations and Manga"
          :show-featured="showFeaturedWorks"
          :preview-limit="8"
          :tabs="typeTabs"
          :active-type="activeType"
          :items="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          :has-more="worksHasMore"
          :limit="worksLimit"
          @select-type="emit('select-type', $event)"
          @show-all="emit('show-all-works')"
          @load-more="emit('load-more-works')"
        />
      </template>

      <!-- ════ ILLUSTRATIONS TAB ════ -->
      <template v-else-if="activeMainTab === 'illustrations'">
        <ProfileSeriesSection
          v-if="showIllustSeries"
          :series="profileSeries.filter(s => s.type === 'illust')"
          :loading="profileSeriesLoading"
          :error="profileSeriesError"
        />
        <ArtworkGridSection
          heading="Illustrations"
          :tabs="[]"
          :active-type="activeType"
          :items="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          :has-more="worksHasMore"
          :limit="worksLimit"
          @load-more="emit('load-more-works')"
        />
      </template>

      <!-- ════ MANGA TAB ════ -->
      <template v-else-if="activeMainTab === 'manga'">
        <ProfileSeriesSection
          v-if="showMangaSeries"
          :series="profileSeries.filter(s => s.type === 'manga')"
          :loading="profileSeriesLoading"
          :error="profileSeriesError"
        />
        <ArtworkGridSection
          heading="Manga"
          :tabs="[]"
          :active-type="activeType"
          :items="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          :has-more="worksHasMore"
          :limit="worksLimit"
          @load-more="emit('load-more-works')"
        />
      </template>

      <!-- ════ NOVELS TAB ════ -->
      <template v-else-if="activeMainTab === 'novels'">
        <ProfileSeriesSection
          v-if="showNovelSeries"
          :series="profileSeries.filter(s => s.type === 'novel')"
          :loading="profileSeriesLoading"
          :error="profileSeriesError"
        />
        <ArtworkGridSection
          heading="Novels"
          :tabs="[]"
          :active-type="activeType"
          :items="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          :has-more="worksHasMore"
          :limit="worksLimit"
          @load-more="emit('load-more-works')"
        />
      </template>

      <ArtworkGridSection
        v-else-if="activeMainTab === 'bookmarks' && isOwnProfile"
        heading="Bookmarks"
        :tabs="bookmarkTypeTabs"
        :active-type="activeBookmarkType"
        :items="visibleBookmarks"
        :loading="bookmarkLoading"
        :error="bookmarkError"
        :has-more="bookmarkHasMore"
        :limit="bookmarkLimit"
        nested-field="artwork"
        empty-icon="fa-regular fa-bookmark"
        empty-text="No bookmark found."
        @select-type="emit('select-bookmark-type', $event)"
        @load-more="emit('load-more-bookmarks')"
      />

      <ArtworkGridSection
        v-else-if="activeMainTab === 'likes' && isOwnProfile"
        heading="Favorites"
        :tabs="likeTypeTabs"
        :active-type="activeLikeType"
        :items="visibleLikes"
        :loading="likeLoading"
        :error="likeError"
        :has-more="likeHasMore"
        :limit="likeLimit"
        nested-field="artwork"
        empty-icon="fa-solid fa-heart"
        empty-text="No favorites found."
        @select-type="emit('select-like-type', $event)"
        @load-more="emit('load-more-likes')"
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
