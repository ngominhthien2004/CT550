<script setup>
import { computed, ref, watch } from 'vue'

const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'save'])

const avatarFile = ref(null)
const avatarPreview = ref('')

const currentAvatar = computed(() => props.user?.avatar || DEFAULT_AVATAR)

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      avatarFile.value = null
      avatarPreview.value = ''
      return
    }

    avatarFile.value = null
    avatarPreview.value = currentAvatar.value
  },
  { immediate: true },
)

watch(currentAvatar, (nextAvatar) => {
  if (!avatarFile.value) {
    avatarPreview.value = nextAvatar
  }
})

function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

function handleSave() {
  const formData = new FormData()

  if (avatarFile.value) {
    formData.append('avatar', avatarFile.value)
  }

  emit('save', formData)
}
</script>

<template>
  <div v-if="show" class="avatar-modal-backdrop" @click.self="emit('close')">
    <div class="avatar-modal-card">
      <header class="avatar-modal-header">
        <div>
          <p class="avatar-modal-kicker">Profile picture</p>
          <h2 class="avatar-modal-title">Edit profile image</h2>
        </div>
        <button type="button" class="avatar-modal-close" aria-label="Close avatar editor" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div class="avatar-modal-body">
        <div class="avatar-preview-container">
          <div class="avatar-preview">
            <img :src="avatarPreview || DEFAULT_AVATAR" alt="Avatar preview" />
            <label class="avatar-upload-overlay">
              <input type="file" accept="image/*" hidden @change="handleAvatarChange">
              <span class="avatar-upload-icon">
                <i class="fa-solid fa-camera" aria-hidden="true"></i>
              </span>
            </label>
          </div>
        </div>

        <p class="avatar-help-text">
          Pick an image to replace the current profile picture. The picture on the profile page stays the same until you save.
        </p>
      </div>

      <footer class="avatar-modal-footer">
        <button type="button" class="avatar-save-btn" @click="handleSave">Save picture</button>
        <button type="button" class="avatar-cancel-btn" @click="emit('close')">Cancel</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.avatar-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.64);
  backdrop-filter: blur(6px);
}

.avatar-modal-card {
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.28);
}

.avatar-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.25rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.avatar-modal-kicker {
  margin: 0 0 0.2rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.avatar-modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.avatar-modal-close {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
}

.avatar-modal-body {
  padding: 1.5rem 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview-container {
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

.avatar-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-preview:hover .avatar-upload-overlay {
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

.avatar-help-text {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
}

.avatar-modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.avatar-save-btn,
.avatar-cancel-btn {
  min-width: 120px;
  height: 44px;
  border: none;
  border-radius: 999px;
  font-weight: 800;
  cursor: pointer;
}

.avatar-save-btn {
  background: linear-gradient(135deg, #0f172a, #2563eb);
  color: #fff;
}

.avatar-cancel-btn {
  background: #e2e8f0;
  color: #334155;
}

@media (max-width: 640px) {
  .avatar-modal-backdrop {
    padding: 12px;
  }
  
  .avatar-modal-footer {
    flex-direction: column;
  }
  
  .avatar-save-btn,
  .avatar-cancel-btn {
    width: 100%;
  }
  
  .avatar-upload-overlay {
    opacity: 1;
    background: rgba(15, 23, 42, 0.2);
  }
}
</style>
