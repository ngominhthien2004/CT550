<script setup>
defineProps({
  hint: {
    type: String,
    default: 'Choose a cover and customize your profile!',
  },
})
</script>

<template>
  <div class="profile-cover" aria-label="Profile cover area">
    <button type="button" class="cover-edit-btn" aria-label="Edit cover">
      <i class="fa-solid fa-pen" aria-hidden="true"></i>
    </button>
    <p class="cover-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.profile-cover {
  height: 188px;
  background: linear-gradient(180deg, #ededed 0%, #e8e8e8 100%);
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  display: grid;
  place-items: center;
  color: #7c8797;
}

.cover-hint {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 600;
}

.cover-edit-btn {
  border: none;
  background: transparent;
  color: #8a93a1;
  font-size: 1.1rem;
}
</style>
