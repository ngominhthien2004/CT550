<script setup>
import { useI18n } from 'vue-i18n'
import { useFollowStore } from '@/stores/follow.store'

const { t } = useI18n()

const props = defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  loadingMore: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  activeUserMenuId: { type: String, default: '' },
  blockSubmittingId: { type: String, default: '' },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle-follow', 'toggle-menu', 'close-menu', 'block-user', 'load-more', 'avatar-error'])

const followStore = useFollowStore()
</script>

<template>
  <p v-if="loading" class="state-note">{{ $t('search.loadingUsers') }}</p>
  <p v-else-if="error" class="state-note error">{{ error }}</p>
  <section v-else-if="users.length" class="user-result-section">
    <h2>{{ $t('search.userTab') }} <span>{{ total.toLocaleString() }}</span></h2>

    <article v-for="user in users" :key="user._id" class="user-search-row">
      <div class="user-profile-column">
        <img :src="user._avatar" :alt="user._displayName" class="avatar avatar--xl user-avatar-large" @error="emit('avatar-error', $event)" />
        <div class="user-profile-copy">
          <h3>{{ user._displayName }}</h3>
          <p class="user-bio">{{ user._shortBio }}</p>
          <div class="user-actions">
            <button
              type="button"
              class="follow-btn-large"
              :class="{ 'is-following': followStore.isFollowingUser(user._id) }"
              :disabled="followStore.isTogglingFollow(user._id)"
              @click="emit('toggle-follow', user._id)"
            >
              {{ followStore.isFollowingUser(user._id) ? $t('profile.following') : $t('profile.follow') }}
            </button>
            <div class="user-more-wrap">
              <button
                type="button"
                class="more-user-btn"
                :aria-label="`More actions for ${user._displayName}`"
                :aria-expanded="activeUserMenuId === user._id"
                @click="emit('toggle-menu', user._id)"
              >
              <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
              </button>
              <div v-if="activeUserMenuId === user._id" class="user-action-menu" role="menu">
                <button type="button" role="menuitem" @click="emit('close-menu')">{{ $t('search.followPrivately') }}</button>
                <span class="menu-separator" aria-hidden="true"></span>
                <button type="button" role="menuitem" @click="emit('close-menu')">{{ $t('search.muteSetting') }}</button>
                <button type="button" role="menuitem" :disabled="blockSubmittingId === user._id" @click="emit('block-user', user)">
                  {{ blockSubmittingId === user._id ? $t('profile.unblocking') : $t('profile.block') }}
                </button>
                <button type="button" role="menuitem" @click="emit('close-menu')">{{ $t('search.reportProblem') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="user-preview-rail">
        <router-link
          v-for="item in user.previews.slice(0, 4)"
          :key="item._id"
          :to="`/artworks/${item._id}`"
          class="user-preview-card"
        >
          <div class="user-preview-thumb">
            <img v-if="item.image" :src="item.image" :alt="item.title || $t('search.artworkPreview')" loading="lazy" />
            <div v-else class="user-preview-fallback"></div>
            <i class="fa-regular fa-heart preview-heart" aria-hidden="true"></i>
          </div>
          <strong>{{ item.title || $t('search.untitledWork') }}</strong>
        </router-link>

        <div v-for="idx in Math.max(0, 4 - user.previews.length)" :key="`empty-preview-${user._id}-${idx}`" class="user-preview-card user-preview-card--empty">
          <div class="user-preview-thumb user-preview-fallback"></div>
          <strong>{{ $t('search.noPublicWork') }}</strong>
        </div>
      </div>
    </article>

    <div v-if="hasMore" class="pagination-wrapper">
      <button
        type="button"
        class="btn btn-outline-secondary btn-load-more"
        :disabled="loadingMore"
        @click="emit('load-more')"
      >
        {{ loadingMore ? $t('common.loading') : $t('common.loadMore') }}
      </button>
    </div>
  </section>
  <p v-else class="state-note">{{ $t('search.noUsersSearch') }}</p>
</template>

<style scoped>
.user-result-section h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.user-result-section h2 span {
  color: var(--muted);
  font-weight: 400;
}

.user-search-row {
  display: flex;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--line);
}

.user-profile-column {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-profile-copy {
  flex: 1;
  min-width: 0;
}

.user-profile-copy h3 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.user-bio {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.5;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.follow-btn-large {
  padding: 0.5rem 1.5rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.88rem;
  border: 2px solid var(--brand);
  background: var(--surface);
  color: var(--brand);
  cursor: pointer;
}

.follow-btn-large.is-following {
  background: var(--brand);
  color: #fff;
}

.user-more-wrap {
  position: relative;
}

.more-user-btn {
  border: none;
  background: transparent;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--muted);
  font-size: 1rem;
}

.user-action-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  min-width: 180px;
  z-index: 10;
  padding: 0.35rem 0;
}

.user-action-menu button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.55rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--text);
  cursor: pointer;
}

.user-action-menu button:hover {
  background: var(--surface-alt);
}

.menu-separator {
  display: block;
  height: 1px;
  background: var(--line);
  margin: 0.25rem 0;
}

.user-preview-rail {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.user-preview-card {
  display: flex;
  flex-direction: column;
  width: 110px;
  text-decoration: none;
  color: inherit;
}

.user-preview-thumb {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-alt);
}

.user-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-preview-fallback {
  width: 100%;
  height: 100%;
  background: var(--surface-alt);
}

.preview-heart {
  position: absolute;
  bottom: 4px;
  right: 4px;
  color: rgba(255,255,255,0.8);
  font-size: 0.75rem;
}

.user-preview-card strong {
  font-size: 0.72rem;
  margin-top: 0.3rem;
  line-height: 1.2;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-preview-card--empty strong {
  color: var(--muted);
}

.pagination-wrapper {
  text-align: center;
  padding: 1.5rem 0;
}

.btn-load-more {
  padding: 0.5rem 2rem;
}

.state-note {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}
</style>
