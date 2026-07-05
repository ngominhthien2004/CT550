<script setup>
import { computed, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImageUpload } from '@/composables/useImageUpload'

const { t } = useI18n()

const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const show = inject('showAvatarModal')
const user = inject('profileUser')
const close = inject('closeAvatarModal')
const save = inject('saveAvatar')
const deleteCover = inject('deleteCover')

const upload = useImageUpload({
  formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
})

const currentAvatar = computed(() => user.value?.avatar || DEFAULT_AVATAR)

function handleClose() {
  try {
    if (typeof close === 'function') {
      close()
    } else {
      show.value = false
    }
  } catch (e) {
    show.value = false
  }
}

watch(
  show,
  (visible) => {
    try {
      if (!visible) {
        upload.reset()
        return
      }
      upload.setPreview(currentAvatar.value)
    } catch (e) {
      // swallow watcher errors
    }
  },
  { immediate: true },
)

watch(currentAvatar, (next) => {
  if (!upload.file.value) upload.setPreview(next)
})

function handleSave() {
  const fd = upload.toFormData('avatar')
  if (fd) save(fd)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="handleClose">
    <div class="modal-card avatar-card">
      <header class="modal-header">
        <h2 class="modal-title">{{ $t('profile.editProfileImage') }}</h2>
        <button type="button" class="modal-close" aria-label="Close" @click="handleClose">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div class="modal-body avatar-body">
        <div class="avatar-preview-wrap">
          <div class="avatar-preview">
            <img :src="upload.preview.value || DEFAULT_AVATAR" alt="Avatar preview" />
            <label class="upload-trigger">
              <input type="file" accept="image/*" hidden @change="upload.selectFile" aria-label="Upload avatar image">
              <span class="upload-trigger-icon">
                <i class="fa-solid fa-camera" aria-hidden="true"></i>
              </span>
            </label>
          </div>
          <button type="button" class="avatar-delete-btn" :title="$t('profile.deleteAvatar')" @click="deleteCover">
            <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>

        <div class="avatar-specs">
          <div class="spec-row">
            <span class="spec-label">{{ $t('profile.supportedFormats') }}</span>
            <span class="spec-value">JPEG / PNG / GIF</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{{ $t('profile.maxFileSize') }}</span>
            <span class="spec-value">5 MB</span>
          </div>
        </div>

        <div class="avatar-info-box avatar-info-note">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>{{ $t('profile.avatarCroppedNote') }}</span>
        </div>

        <p v-if="upload.error.value" class="avatar-error">{{ upload.error.value }}</p>
      </div>

      <footer class="modal-footer avatar-footer">
        <button type="button" class="action-pill action-pill--post avatar-confirm-btn" @click="handleSave">{{ $t('profile.confirm') }}</button>
        <button type="button" class="action-pill avatar-cancel-btn" @click="handleClose">{{ $t('profile.cancel') }}</button>
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
  border-radius: 16px;
  width: min(400px, 90vw);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  height: auto;
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--muted);
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text);
}

.avatar-body {
  padding: 24px 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.avatar-preview-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-preview {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 999px;
  overflow: hidden;
  border: 3px solid var(--surface);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: var(--surface-alt);
  cursor: pointer;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-trigger {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-trigger:hover .upload-trigger-icon {
  opacity: 1;
}

.upload-trigger-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-delete-btn {
  position: absolute;
  right: calc(50% - 90px);
  bottom: 0;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: none;
  background: var(--surface-alt);
  color: var(--muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: background 0.2s, color 0.2s;
}

.avatar-delete-btn:hover {
  background: var(--danger, #dc3545);
  color: #fff;
}

.avatar-specs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.spec-label {
  font-weight: 600;
  color: var(--brand);
}

.spec-value {
  color: var(--muted);
}

.avatar-info-box {
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.avatar-info-note {
  background: var(--surface-alt);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--muted);
}

.avatar-info-note i {
  margin-top: 2px;
  flex-shrink: 0;
}

.avatar-error {
  color: var(--danger, #dc3545);
  font-size: 0.85rem;
  margin: 8px 0 0;
}

.avatar-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px 20px;
  border-top: 1px solid var(--line);
}

.avatar-confirm-btn {
  width: 100%;
  justify-content: center;
  padding: 10px 0;
}

.avatar-cancel-btn {
  width: 100%;
  justify-content: center;
  padding: 10px 0;
}

@media (max-width: 640px) {
  .avatar-card {
    width: 95vw;
    max-height: 95vh;
  }
}
</style>
