<script setup>
import { computed, watch } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'

const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'save'])

const upload = useImageUpload({
  formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
})

const currentAvatar = computed(() => props.user?.avatar || DEFAULT_AVATAR)

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      upload.reset()
      return
    }
    upload.setPreview(currentAvatar.value)
  },
  { immediate: true },
)

watch(currentAvatar, (next) => {
  if (!upload.file.value) upload.setPreview(next)
})

function handleSave() {
  const fd = upload.toFormData('avatar')
  if (fd) emit('save', fd)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')" @keydown.enter.prevent="emit('close')" @keydown.space.prevent="emit('close')" tabindex="0" role="button">
    <div class="modal-card avatar-card">
      <header class="modal-header">
        <div>
          <p class="avatar-kicker">Profile picture</p>
          <h2 class="modal-title">Edit profile image</h2>
        </div>
        <button type="button" class="modal-close avatar-close" aria-label="Close avatar editor" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div class="modal-body modal-body--scroll avatar-body">
        <div class="avatar-preview-wrap">
          <div class="avatar-preview">
            <img :src="upload.preview.value || DEFAULT_AVATAR" alt="Avatar preview" />
            <label class="upload-overlay">
              <input type="file" accept="image/*" hidden @change="upload.selectFile" aria-label="Upload avatar image">
              <span class="avatar-upload-icon">
                <i class="fa-solid fa-camera" aria-hidden="true"></i>
              </span>
            </label>
          </div>
        </div>

        <p class="avatar-help">
          Pick an image to replace the current profile picture. The picture on the profile page stays the same until you save.
        </p>
      </div>

      <footer class="modal-footer modal-footer--row">
        <button type="button" class="modal-btn modal-btn--accent modal-btn--inline" @click="handleSave">Save picture</button>
        <button type="button" class="modal-btn modal-btn--secondary modal-btn--inline" @click="emit('close')">Cancel</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import '../../assets/styles/modal.css';

.modal-backdrop {
  backdrop-filter: blur(6px);
  background: rgba(15, 23, 42, 0.64);
}

.avatar-card {
  max-height: 90vh;
  border-radius: 24px;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.28);
}

.modal-header {
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.2rem 1.25rem 1rem;
  height: auto;
}

.avatar-kicker {
  margin: 0 0 0.2rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.avatar-close {
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  color: #334155;
  position: static;
  transform: none;
}

.avatar-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1.25rem;
}

.avatar-preview-wrap {
  margin-bottom: 1.5rem;
}

.avatar-preview {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 999px;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
  background: #f1f5f9;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-preview:hover .upload-overlay {
  opacity: 1;
}

.avatar-upload-icon {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.25rem;
}

.avatar-help {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .modal-footer--row {
    flex-direction: column;
  }

  .modal-btn--inline {
    width: 100%;
  }

  .upload-overlay {
    opacity: 1;
    background: rgba(15, 23, 42, 0.2);
  }
}
</style>
