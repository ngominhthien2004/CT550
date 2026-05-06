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

defineEmits(['edit-cover', 'delete-cover'])
</script>

<template>
  <div
    class="profile-cover"
    :style="coverImage ? { backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.28)), url(${coverImage})` } : { background: DEFAULT_COVER }"
    aria-label="Profile cover area"
  >
    <div v-if="isOwnProfile" class="cover-actions">
      <button type="button" class="cover-edit-btn" aria-label="Edit cover" @click="$emit('edit-cover')">
        <i class="fa-solid fa-pen" aria-hidden="true"></i>
      </button>
      <button type="button" class="cover-delete-btn" aria-label="Delete cover" @click="$emit('delete-cover')">
        <i class="fa-solid fa-trash" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-cover {
  --cover-bleed: 72px;
  height: 300px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  margin-inline: -72px;
  display: block;
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

.cover-actions,
.cover-edit-btn,
.cover-delete-btn {
  position: relative;
  z-index: 1;
}

.cover-actions {
  position: absolute;
  bottom: 1.5rem;
  right: calc(1.5rem + var(--cover-bleed));
  display: flex;
  gap: 0.5rem;
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

.cover-delete-btn {
  border: none;
  background: rgba(239, 68, 68, 0.2);
  color: #fff;
  font-size: 1.05rem;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
}

@media (max-width: 820px) {
  .profile-cover {
    --cover-bleed: 18px;
    height: 220px;
    padding: 1rem 1rem 1.15rem;
    margin-inline: -18px;
  }

  .cover-actions {
    right: calc(1rem + var(--cover-bleed));
    bottom: 1rem;
  }
}
</style>
