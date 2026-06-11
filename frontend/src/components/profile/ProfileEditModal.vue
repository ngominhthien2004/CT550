<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'save'])

const form = reactive({
  displayName: '',
  bio: '',
  website: '',
  socialLinks: { x: '', facebook: '', instagram: '' },
  gender: 'rather_not_say',
  location: '',
  birthYear: null,
  birthdayMonth: 1,
  birthdayDay: 1,
})

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'rather_not_say', label: 'Rather not say' },
]

const months = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
const days = Array.from({ length: 31 }, (_, i) => i + 1)

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

watch(() => props.user, (u) => {
  if (!u) return
  form.displayName = u.displayName || u.username || ''
  form.bio = u.bio || ''
  form.website = u.website || ''
  form.socialLinks = {
    x: u.socialLinks?.x || u.socialLinks?.twitter || '',
    facebook: u.socialLinks?.facebook || '',
    instagram: u.socialLinks?.instagram || '',
  }
  form.gender = u.gender || 'rather_not_say'
  form.location = u.location || ''
  form.birthYear = u.birthYear || null
  form.birthdayMonth = u.birthdayMonth || 1
  form.birthdayDay = u.birthdayDay || 1
}, { immediate: true })

function handleSave() {
  const fd = new FormData()
  fd.append('displayName', form.displayName)
  fd.append('bio', form.bio)
  fd.append('website', form.website)
  fd.append('socialLinks', JSON.stringify(form.socialLinks))
  fd.append('gender', form.gender)
  fd.append('location', form.location)
  if (form.birthYear) fd.append('birthYear', form.birthYear)
  fd.append('birthdayMonth', form.birthdayMonth)
  fd.append('birthdayDay', form.birthdayDay)
  emit('save', fd)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card edit-card">
      <header class="modal-header">
        <h2 class="modal-title">Edit profile</h2>
        <button type="button" class="modal-close" aria-label="Close" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div class="modal-body modal-body--scroll form-content">
        <!-- Nickname -->
        <div class="form-group">
          <label class="field-label">Nickname</label>
          <div class="input-with-limit">
            <input type="text" v-model="form.displayName" maxlength="15" placeholder="Nickname" class="form-input">
            <span class="char-limit">{{ form.displayName.length }}/15</span>
          </div>
        </div>

        <!-- Self Introduction -->
        <div class="form-group">
          <label class="field-label">Self introduction</label>
          <textarea v-model="form.bio" placeholder="Tell us about yourself" class="form-textarea" rows="4"></textarea>
        </div>

        <!-- Website -->
        <div class="form-group">
          <label class="field-label">Website</label>
          <input type="text" v-model="form.website" class="form-input" placeholder="https://...">
        </div>

        <!-- Social Media -->
        <div class="form-group">
          <label class="field-label">Social media</label>
          <div class="social-row">
            <div class="social-input-wrap">
              <i class="fa-brands fa-x-twitter social-icon"></i>
              <input type="text" v-model="form.socialLinks.x" class="social-input" placeholder="X username">
            </div>
          </div>
          <div class="social-row">
            <div class="social-input-wrap">
              <i class="fa-brands fa-facebook social-icon"></i>
              <input type="text" v-model="form.socialLinks.facebook" class="social-input" placeholder="Facebook username">
            </div>
          </div>
          <div class="social-row">
            <div class="social-input-wrap">
              <i class="fa-brands fa-instagram social-icon"></i>
              <input type="text" v-model="form.socialLinks.instagram" class="social-input" placeholder="Instagram username">
            </div>
          </div>
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
          </div>
        </div>

        <!-- Birth year -->
        <div class="form-group">
          <label class="field-label">Birth year</label>
          <div class="split-row">
            <select v-model="form.birthYear" class="form-select full-width">
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
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

      <footer class="edit-footer">
        <button type="button" class="modal-btn modal-btn--primary" @click="handleSave">Save Changes</button>
        <button type="button" class="modal-btn modal-btn--secondary" @click="emit('close')">Cancel</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import '../../assets/styles/modal.css';

.edit-card {
  max-width: 600px;
  max-height: 90vh;
  border-radius: 16px;
}

.form-content {
  padding: 20px 24px;
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

.social-icon {
  width: 36px;
  text-align: center;
  color: #666;
  font-size: 1rem;
}

.social-input {
  border: none;
  background: transparent;
}

.split-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.full-width {
  flex: 1;
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

.edit-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

/* Custom Scrollbar */
.modal-body--scroll::-webkit-scrollbar {
  width: 6px;
}
.modal-body--scroll::-webkit-scrollbar-track {
  background: transparent;
}
.modal-body--scroll::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
</style>
