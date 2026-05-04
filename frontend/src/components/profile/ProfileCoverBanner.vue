<script setup>
const DEFAULT_COVER = 'linear-gradient(135deg, #f1f5f9 0%, #dbeafe 52%, #fef3c7 100%)'

defineProps({
  user: {
    type: Object,
    required: true,
  },
  coverImage: {
    type: String,
    default: '',
  },
  isOwnProfile: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="profile-cover"
    :style="coverImage ? { backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.28)), url(${coverImage})` } : { background: DEFAULT_COVER }"
    aria-label="Profile cover area"
  >
    <button v-if="isOwnProfile" type="button" class="cover-edit-btn" aria-label="Edit cover">
      <i class="fa-solid fa-pen" aria-hidden="true"></i>
    </button>
    <div class="cover-copy">
      <span class="cover-kicker">{{ isOwnProfile ? 'Your profile' : 'Creator profile' }}</span>
      <p class="cover-hint">{{ user.displayName || user.username }}</p>
    </div>
  </div>
</template>

<style scoped>
.profile-cover {
  height: 300px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  margin-inline: -72px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.15rem 1.5rem 1.4rem;
  color: #fff;
  background-position: center;
  background-size: cover;
  overflow: hidden;
}

.profile-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.3));
  pointer-events: none;
}

.cover-copy,
.cover-edit-btn {
  position: relative;
  z-index: 1;
}

.cover-copy {
  display: grid;
  gap: 0.3rem;
}

.cover-hint {
  margin: 0;
  font-size: clamp(1.25rem, 1rem + 1vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.03em;
}

.cover-kicker {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.9;
}

.cover-edit-btn {
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 1.1rem;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
}

@media (max-width: 820px) {
  .profile-cover {
    height: 220px;
    padding: 1rem 1rem 1.15rem;
    margin-inline: -18px;
  }
}
</style>
