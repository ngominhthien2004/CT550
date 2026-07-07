<script setup>
import { useFollowStore } from '@/stores/follow.store'

const props = defineProps({
  creators: { type: Array, required: true },
})

const emit = defineEmits(['toggle-follow'])
const followStore = useFollowStore()
</script>

<template>
  <section class="plans-creators-strip">
    <h2 class="section-heading">Creators with open plans</h2>
    <div class="creators-row">
      <router-link
        v-for="creator in creators"
        :key="creator._id"
        :to="{ path: '/account', query: { user: creator._id, tab: 'requests' } }"
        class="creator-chip"
      >
        <img :src="creator.avatar" :alt="creator.displayName" class="creator-avatar" />
        <div class="creator-chip-info">
          <span class="creator-chip-name">{{ creator.displayName }}</span>
          <span class="creator-chip-count">{{ creator.planCount }} plan{{ creator.planCount !== 1 ? 's' : '' }}</span>
        </div>
        <button
          class="follow-btn-sm"
          :class="{ following: followStore.isFollowingUser(creator._id) }"
          :disabled="followStore.isTogglingFollow(creator._id)"
          @click.prevent="emit('toggle-follow', creator._id)"
        >
          {{ followStore.isFollowingUser(creator._id) ? 'Following' : 'Follow' }}
        </button>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.section-heading {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brand);
  margin: 0 0 0.75rem;
}

.creators-row {
  display: flex;
  gap: 0.7rem;
  overflow-x: auto;
  padding-bottom: 0.3rem;
}

.creator-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  background: var(--surface);
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
  min-width: 200px;
  flex-shrink: 0;
}

.creator-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-chip-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.creator-chip-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.creator-chip-count {
  font-size: 0.7rem;
  color: var(--muted);
}

.follow-btn-sm {
  border: 1px solid var(--accent);
  border-radius: 999px;
  background: var(--surface);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  white-space: nowrap;
}

.follow-btn-sm.following {
  background: var(--accent);
  color: #fff;
}

@media (max-width: 640px) {
  .creator-chip {
    min-width: 170px;
  }
}
</style>
