<script setup>
import { inject, computed } from 'vue'
import ProfileCoverBanner from '../profile/ProfileCoverBanner.vue'
import ProfileSummarySection from '../profile/ProfileSummarySection.vue'
import ProfilePrimaryTabs from '../profile/ProfilePrimaryTabs.vue'
import ArtworkGridSection from '../profile/ArtworkGridSection.vue'
import ProfileRequestsSection from '../profile/ProfileRequestsSection.vue'
import ProfileSeriesSection from '../profile/ProfileSeriesSection.vue'
import ProfileCoverModal from '../profile/ProfileCoverModal.vue'
import ProfileEditModal from '../profile/ProfileEditModal.vue'
import ProfileAvatarModal from '../profile/ProfileAvatarModal.vue'
import BlockedUsersList from '../profile/BlockedUsersList.vue'

const user = inject('profileUser')
const isOwnProfile = inject('isOwnProfile')
const activeMainTab = inject('activeMainTab')
const profileSeries = inject('profileSeries')
const profileSeriesLoading = inject('profileSeriesLoading')
const profileSeriesError = inject('profileSeriesError')
const showFeaturedWorks = inject('showFeaturedWorks')
const typeTabs = inject('typeTabs')
const activeType = inject('activeType')
const visibleArtworks = inject('visibleArtworks')
const loadingArtworks = inject('loadingArtworks')
const artworksError = inject('artworksError')
const worksHasMore = inject('worksHasMore')
const worksLimit = inject('worksLimit')
const bookmarkTypeTabs = inject('bookmarkTypeTabs')
const activeBookmarkType = inject('activeBookmarkType')
const visibleBookmarks = inject('visibleBookmarks')
const bookmarkLoading = inject('bookmarkLoading')
const bookmarkError = inject('bookmarkError')
const bookmarkHasMore = inject('bookmarkHasMore')
const bookmarkLimit = inject('bookmarkLimit')
const likeTypeTabs = inject('likeTypeTabs')
const activeLikeType = inject('activeLikeType')
const visibleLikes = inject('visibleLikes')
const likeLoading = inject('likeLoading')
const likeError = inject('likeError')
const likeHasMore = inject('likeHasMore')
const likeLimit = inject('likeLimit')
const requestTerms = inject('requestTerms')
const requestTermsLoading = inject('requestTermsLoading')
const requestTermsError = inject('requestTermsError')
const showEditModal = inject('showEditModal')
const showCoverModal = inject('showCoverModal')
const showAvatarModal = inject('showAvatarModal')
const selectType = inject('selectType')
const selectBookmarkType = inject('selectBookmarkType')
const selectLikeType = inject('selectLikeType')
const showAllWorks = inject('showAllWorks')
const loadMoreWorks = inject('loadMoreWorks')
const loadMoreBookmarks = inject('loadMoreBookmarks')
const loadMoreLikes = inject('loadMoreLikes')
const profileLoading = inject('profileLoading')
const profileError = inject('profileError')

const workTypeTabs = [
  { key: 'illustrations', type: 'illust', heading: 'Illustrations' },
  { key: 'manga', type: 'manga', heading: 'Manga' },
  { key: 'novels', type: 'novel', heading: 'Novels' },
]
</script>

<template>
  <section class="profile-page page-block">
    <ProfileCoverBanner />

    <div class="profile-main">
      <ProfileSummarySection />
      <div aria-live="polite">
        <p v-if="profileLoading" class="text-secondary mb-1">Loading profile...</p>
        <p v-if="profileError" class="text-danger mb-1">{{ profileError }}</p>
      </div>
      <ProfilePrimaryTabs />

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
          @select-type="selectType"
          @show-all="showAllWorks"
          @load-more="loadMoreWorks"
        />
      </template>

      <template v-for="tab in workTypeTabs" :key="tab.key">
        <template v-if="activeMainTab === tab.key">
          <ProfileSeriesSection
            :series="profileSeries.filter(s => s.type === tab.type)"
            :loading="profileSeriesLoading"
            :error="profileSeriesError"
          />
          <ArtworkGridSection
            :heading="tab.heading"
            :tabs="[]"
            :active-type="activeType"
            :items="visibleArtworks"
            :loading="loadingArtworks"
            :error="artworksError"
            :has-more="worksHasMore"
            :limit="worksLimit"
            @load-more="loadMoreWorks"
          />
        </template>
      </template>

      <ArtworkGridSection
        v-if="activeMainTab === 'bookmarks' && isOwnProfile"
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
        @select-type="selectBookmarkType"
        @load-more="loadMoreBookmarks"
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
        @select-type="selectLikeType"
        @load-more="loadMoreLikes"
      />

      <ProfileRequestsSection
        v-else-if="activeMainTab === 'requests'"
        :terms="requestTerms"
        :loading="requestTermsLoading"
        :error="requestTermsError"
      />

      <BlockedUsersList
        v-else-if="activeMainTab === 'blocked' && isOwnProfile"
      />

      <section v-else-if="(activeMainTab === 'bookmarks' || activeMainTab === 'likes') && !isOwnProfile" class="bookmarks-placeholder">
        This list is only available on your own profile.
      </section>
    </div>
    <Teleport to="body">
      <ProfileAvatarModal />
      <ProfileCoverModal />
      <ProfileEditModal />
    </Teleport>
  </section>
</template>

<style scoped>
.profile-page {
  background: var(--surface);
  min-height: calc(100vh - 112px);
  overflow: clip;
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
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 1rem 1.1rem;
  color: var(--muted);
  background: var(--surface);
}

@media (max-width: 820px) {
  .profile-main {
    padding: 0 0.9rem 2rem;
  }
}
</style>
