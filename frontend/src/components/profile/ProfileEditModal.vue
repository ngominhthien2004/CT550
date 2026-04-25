<script setup>
import { ref, reactive, watch, onMounted } from 'vue'

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

const form = reactive({
  displayName: '',
  bio: '',
  website: '',
  gender: 'rather_not_say',
  location: '',
  birthYear: 1996,
  birthdayMonth: 1,
  birthdayDay: 1,
  occupation: '',
  socialMedia: {
    handle: '',
    platform: 'X'
  }
})

const avatarPreview = ref('')
const coverPreview = ref('')
const avatarFile = ref(null)
const coverFile = ref(null)

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'rather_not_say', label: 'Rather not say' }
]

const months = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
]

const years = Array.from({ length: 100 }, (_, i) => 2024 - i)
const days = Array.from({ length: 31 }, (_, i) => i + 1)

watch(() => props.user, (newUser) => {
  if (newUser) {
    form.displayName = newUser.displayName || newUser.username || ''
    form.bio = newUser.bio || ''
    form.website = newUser.website || ''
    form.gender = newUser.gender || 'rather_not_say'
    form.location = newUser.location || ''
    form.birthYear = newUser.birthYear || 1996
    form.birthdayMonth = newUser.birthdayMonth || 1
    form.birthdayDay = newUser.birthdayDay || 1
    form.occupation = newUser.occupation || ''
    avatarPreview.value = newUser.avatar || ''
    coverPreview.value = newUser.coverImage || ''
  }
}, { immediate: true })

function handleAvatarChange(e) {
  const file = e.target.files[0]
  if (file) {
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }
}

function handleCoverChange(e) {
  const file = e.target.files[0]
  if (file) {
    coverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

function handleSave() {
  const formData = new FormData()
  formData.append('displayName', form.displayName)
  formData.append('bio', form.bio)
  formData.append('website', form.website)
  formData.append('gender', form.gender)
  formData.append('location', form.location)
  formData.append('birthYear', form.birthYear)
  formData.append('birthdayMonth', form.birthdayMonth)
  formData.append('birthdayDay', form.birthdayDay)
  formData.append('occupation', form.occupation)
  
  if (avatarFile.value) {
    formData.append('avatar', avatarFile.value)
  }
  if (coverFile.value) {
    formData.append('coverImage', coverFile.value)
  }

  emit('save', formData)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
    <div class="edit-profile-card">
      <header class="modal-header">
        <button class="close-btn" @click="emit('close')">
          <i class="fas fa-times"></i>
        </button>
        <h2 class="modal-title">Edit profile</h2>
      </header>

      <div class="modal-body">
        <!-- Cover Image Section -->
        <div class="cover-upload-area" :style="{ backgroundImage: `url(${coverPreview})` }">
          <label class="upload-overlay">
            <input type="file" accept="image/*" @change="handleCoverChange" hidden>
            <div class="upload-content">
              <i class="fas fa-pencil-alt"></i>
              <span>Set a cover image</span>
            </div>
          </label>
        </div>

        <div class="form-content">
          <!-- Profile Image Section -->
          <div class="profile-image-section">
            <h3 class="section-label">Profile images</h3>
            <label class="avatar-upload-box">
              <input type="file" accept="image/*" @change="handleAvatarChange" hidden>
              <div class="avatar-wrapper">
                <img :src="avatarPreview || 'https://s.pximg.net/common/images/no_profile.png'" alt="Avatar" class="avatar-img">
                <div class="avatar-edit-overlay">
                  <i class="fas fa-camera"></i>
                </div>
              </div>
            </label>
          </div>

          <!-- Nickname -->
          <div class="form-group">
            <label class="field-label">Nickname</label>
            <div class="input-with-limit">
              <input 
                type="text" 
                v-model="form.displayName" 
                maxlength="15" 
                placeholder="Nickname"
                class="form-input"
              >
              <span class="char-limit">{{ form.displayName.length }}/15</span>
            </div>
          </div>

          <!-- Self Introduction -->
          <div class="form-group">
            <label class="field-label">Self introduction</label>
            <textarea 
              v-model="form.bio" 
              placeholder="Tell us about yourself"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- Website -->
          <div class="form-group">
            <label class="field-label">Website</label>
            <input 
              type="text" 
              v-model="form.website" 
              class="form-input"
              placeholder="https://..."
            >
          </div>

          <!-- Social Media -->
          <div class="form-group">
            <label class="field-label">Social media</label>
            <div class="social-row">
              <div class="social-input-wrap">
                <span class="social-prefix">@</span>
                <input 
                  type="text" 
                  v-model="form.socialMedia.handle" 
                  class="social-input"
                  placeholder="username"
                >
              </div>
              <select v-model="form.socialMedia.platform" class="social-select">
                <option value="X">X</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
              </select>
            </div>
            <button class="add-media-btn">
              Add media
            </button>
          </div>

          <!-- Gender -->
          <div class="form-group">
            <label class="field-label">Gender</label>
            <div class="split-row">
              <div class="radio-group">
                <label v-for="opt in genderOptions" :key="opt.value" class="radio-label">
                  <input type="radio" :value="opt.value" v-model="form.gender">
                  <span class="radio-text">{{ opt.label }}</span>
                </label>
              </div>
              <select class="visibility-select">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          <!-- Location -->
          <div class="form-group">
            <label class="field-label">Location</label>
            <div class="split-row">
              <select v-model="form.location" class="form-select full-width">
                <option value="">----</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Japan">Japan</option>
                <option value="USA">USA</option>
              </select>
              <select class="visibility-select">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          <!-- Birth year -->
          <div class="form-group">
            <label class="field-label">Birth year</label>
            <div class="split-row">
              <select v-model="form.birthYear" class="form-select full-width">
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
              </select>
              <select class="visibility-select">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          <!-- Birthday -->
          <div class="form-group">
            <label class="field-label">Birthday</label>
            <div class="split-row">
              <div class="birthday-inputs">
                <select v-model="form.birthdayMonth" class="form-select">
                  <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <select v-model="form.birthdayDay" class="form-select">
                  <option v-for="d in days" :key="d" :value="d">{{ d }}{{ getDaySuffix(d) }}</option>
                </select>
              </div>
              <select class="visibility-select">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          <!-- Occupation -->
          <div class="form-group">
            <label class="field-label">Occupation</label>
            <div class="split-row">
              <select v-model="form.occupation" class="form-select full-width">
                <option value="">----</option>
                <option value="Artist">Artist</option>
                <option value="Designer">Designer</option>
                <option value="Student">Student</option>
              </select>
              <select class="visibility-select">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          <!-- Workspace -->
          <div class="workspace-section">
            <label class="field-label">Workspace</label>
            <a href="#" class="workspace-link">
              Edit your workspace <i class="fas fa-external-link-alt"></i>
            </a>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <button class="save-btn" @click="handleSave">Save Changes</button>
        <button class="cancel-btn" @click="emit('close')">Cancel</button>
      </footer>
    </div>
  </div>
</template>

<script>
function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.edit-profile-card {
  background: #fff;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  position: relative;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 8px;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.modal-title {
  width: 100%;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}

.cover-upload-area {
  height: 200px;
  background-color: #f0f0f0;
  background-size: cover;
  background-position: center;
  position: relative;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-overlay:hover {
  background: rgba(0, 0, 0, 0.2);
}

.upload-content {
  text-align: center;
  color: #444;
  font-weight: 600;
}

.upload-content i {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.form-content {
  padding: 20px 24px;
}

.section-label {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #333;
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-upload-box:hover .avatar-edit-overlay {
  opacity: 1;
}

.form-group {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333;
}

.input-with-limit {
  position: relative;
}

.form-input, .form-textarea, .form-select, .social-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #f8f9fa;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #0096fa;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 150, 250, 0.1);
}

.char-limit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #999;
}

.social-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.social-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.social-prefix {
  padding-left: 12px;
  color: #999;
}

.social-input {
  border: none;
  background: transparent;
}

.social-select {
  width: 120px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 8px;
  background: #f8f9fa;
}

.add-media-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #444;
  cursor: pointer;
}

.split-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.full-width {
  flex: 1;
}

.visibility-select {
  width: 110px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  background: #f8f9fa;
  font-size: 0.85rem;
}

.radio-group {
  flex: 1;
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.birthday-inputs {
  flex: 1;
  display: flex;
  gap: 8px;
}

.workspace-link {
  color: #0096fa;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.workspace-link i {
  font-size: 0.75rem;
  margin-left: 4px;
}

.modal-footer {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #eee;
}

.save-btn {
  background: #0096fa;
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #007ecc;
}

.cancel-btn {
  background: #f0f0f0;
  color: #444;
  border: none;
  padding: 12px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #e4e4e4;
}

/* Custom Scrollbar */
.modal-body::-webkit-scrollbar {
  width: 6px;
}
.modal-body::-webkit-scrollbar-track {
  background: transparent;
}
.modal-body::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
</style>
