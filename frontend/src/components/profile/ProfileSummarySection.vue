<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  profileLocation: {
    type: String,
    default: 'Japan (Private)',
  },
})

const avatarInitial = computed(() => (props.user?.username || 'U').charAt(0).toUpperCase())
</script>

<template>
  <div class="profile-summary">
    <div class="avatar-wrap" aria-label="User avatar">{{ avatarInitial }}</div>

    <div class="profile-meta">
      <h1 class="profile-name">{{ user.username }}</h1>
      <p class="profile-following">{{ followingCount }} Following</p>
      <p class="profile-subtle">
        <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
        {{ profileLocation }}
      </p>
      <router-link to="/account" class="profile-link">View profile</router-link>
    </div>

    <div class="profile-actions">
      <button type="button" class="edit-profile-btn">Edit profile</button>
      <button type="button" class="share-btn" aria-label="Share profile" title="Share profile">
        <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-summary {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.avatar-wrap {
  width: 76px;
  height: 76px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dbe5ef, #b9c8d6);
  color: #6b7785;
  border: 3px solid #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.profile-meta {
  padding-top: 18px;
  display: grid;
  gap: 0.3rem;
}

.profile-name {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
}

.profile-following,
.profile-subtle {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.profile-link {
  text-decoration: none;
  color: #6b7280;
  font-size: 0.86rem;
}

.profile-link:hover,
.profile-link:focus-visible {
  color: #3b82f6;
}

.profile-actions {
  margin-left: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.edit-profile-btn {
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  padding: 0.38rem 0.92rem;
  font-size: 0.83rem;
  font-weight: 700;
}

.share-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
}

@media (max-width: 820px) {
  .profile-summary {
    flex-wrap: wrap;
  }

  .profile-actions {
    margin-left: 0;
    padding-top: 0;
  }
}
</style>
