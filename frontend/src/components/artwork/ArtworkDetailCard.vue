<script setup>
import { computed, toRefs } from 'vue'
import ArtworkDetailViewer from './detail/ArtworkDetailViewer.vue'
import ArtworkDetailCaption from './detail/ArtworkDetailCaption.vue'
import ArtworkDetailSidebar from './detail/ArtworkDetailSidebar.vue'
import ArtworkDetailAuthorRow from './detail/ArtworkDetailAuthorRow.vue'
import ArtworkDetailWorksStrip from './detail/ArtworkDetailWorksStrip.vue'
import ArtworkDetailCommentsCard from './detail/ArtworkDetailCommentsCard.vue'
import ArtworkDetailRelatedGrid from './detail/ArtworkDetailRelatedGrid.vue'

defineEmits(['toggle-bookmark', 'toggle-like', 'toggle-follow'])

const props = defineProps({
  artwork: {
    type: Object,
    required: true,
  },
  displayAuthor: {
    type: String,
    default: 'Unknown artist',
  },
  artistId: {
    type: String,
    default: '',
  },
  isOwnArtist: {
    type: Boolean,
    default: false,
  },
  relatedWorks: {
    type: Array,
    default: () => [],
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  isLiked: {
    type: Boolean,
    default: false,
  },
  likeLoading: {
    type: Boolean,
    default: false,
  },
  likeError: {
    type: String,
    default: '',
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
  artistFollowersCount: {
    type: Number,
    default: 0,
  },
  artistFollowingCount: {
    type: Number,
    default: 0,
  },
  bookmarkLoading: {
    type: Boolean,
    default: false,
  },
  bookmarkError: {
    type: String,
    default: '',
  },
})

const {
  artwork,
  displayAuthor,
  artistId,
  isOwnArtist,
  relatedWorks,
  isBookmarked,
  isLiked,
  likeLoading,
  likeError,
  isFollowing,
  followLoading,
  followError,
  artistFollowersCount,
  artistFollowingCount,
  bookmarkLoading,
  bookmarkError,
} = toRefs(props)

const uploadedAtLabel = computed(() => {
  const createdAt = artwork.value?.createdAt

  if (!createdAt) {
    return ''
  }

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString()
})

const sameAuthorWorks = computed(() => {
  if (!artistId.value) {
    return []
  }

  if (!Array.isArray(relatedWorks.value)) {
    return []
  }

  return relatedWorks.value
    .filter((item) => item?.user?._id === artistId.value)
    .slice(0, 6)
})

const authorOtherWorks = computed(() => {
  if (!artistId.value) {
    return []
  }

  if (!Array.isArray(relatedWorks.value)) {
    return []
  }

  return relatedWorks.value
    .filter((item) => item?._id && item._id !== artwork.value?._id)
    .filter((item) => item?.user?._id === artistId.value)
    .slice(0, 10)
})
</script>

<template>
  <article class="artwork-detail-template d-grid gap-4 mx-auto">
    <section class="detail-top">
      <div class="left-col">
        <ArtworkDetailViewer
          :artwork="artwork"
          :is-liked="isLiked"
          :is-bookmarked="isBookmarked"
          :like-loading="likeLoading"
          :bookmark-loading="bookmarkLoading"
          @toggle-like="$emit('toggle-like')"
          @toggle-bookmark="$emit('toggle-bookmark')"
        />
        <ArtworkDetailCaption
          :artwork="artwork"
          :uploaded-at-label="uploadedAtLabel"
          :is-liked="isLiked"
          :is-bookmarked="isBookmarked"
          :like-loading="likeLoading"
          :bookmark-loading="bookmarkLoading"
          :like-error="likeError"
          :bookmark-error="bookmarkError"
          @toggle-like="$emit('toggle-like')"
          @toggle-bookmark="$emit('toggle-bookmark')"
        />
        <ArtworkDetailAuthorRow
          :display-author="displayAuthor"
          :artist-id="artistId"
          :is-own-artist="isOwnArtist"
          :is-following="isFollowing"
          :follow-loading="followLoading"
          @toggle-follow="$emit('toggle-follow')"
        />
        <ArtworkDetailWorksStrip :works="authorOtherWorks" />
      </div>

      <ArtworkDetailSidebar
        :display-author="displayAuthor"
        :artist-id="artistId"
        :is-own-artist="isOwnArtist"
        :is-following="isFollowing"
        :follow-loading="followLoading"
        :follow-error="followError"
        :artist-followers-count="artistFollowersCount"
        :artist-following-count="artistFollowingCount"
        :same-author-works="sameAuthorWorks"
        @toggle-follow="$emit('toggle-follow')"
      />
    </section>

    <!-- Corrected: Related works and Comments now span the full width below the main content -->
    <section class="below-shell d-grid gap-3 mt-4">
      <ArtworkDetailCommentsCard :artwork-id="artwork._id" />
      <ArtworkDetailRelatedGrid :related-works="relatedWorks" />
    </section>
  </article>
</template>

<style scoped>
.artwork-detail-template {
  width: 100%;
  max-width: 1120px;
  margin: 0;
}

.detail-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 2.5rem; /* Increased gap for better Pixiv feel */
  align-items: start;
  position: relative;
}

.left-col {
  min-width: 0;
  width: 100%;
  overflow: hidden; /* Prevent content from leaking out */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.below-shell {
  margin-top: 1rem;
}

@media (max-width: 1200px) {
  .detail-top {
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 1rem;
  }
}

@media (max-width: 1000px) {
  .detail-top {
    grid-template-columns: 1fr;
  }
  .artwork-detail-template {
    padding: 0 1rem;
  }
}
</style>
