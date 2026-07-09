<script setup>
import { reactive, computed, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const show = inject('showEditModal')
const user = inject('profileUser')
const close = inject('closeEditModal')
const save = inject('saveProfile')

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

const genderOptions = computed(() => [
  { value: 'male', label: t('profile.male') },
  { value: 'female', label: t('profile.female') },
  { value: 'rather_not_say', label: t('profile.ratherNotSay') },
])

const months = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value, { month: 'short' })
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: fmt.format(new Date(2024, i, 1))
  }))
})

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

const daysWithSuffix = computed(() => {
  if (locale.value === 'en') {
    return days.map(d => ({ value: d, label: `${d}${getDaySuffix(d)}` }))
  }
  return days.map(d => ({ value: d, label: String(d) }))
})

watch(user, (u) => {
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
  save(fd)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="close" @keydown.esc="close" tabindex="0" role="dialog" aria-modal="true">
    <div class="modal-card edit-card">
      <header class="modal-header">
        <h2 class="modal-title">{{ $t('profile.editProfile') }}</h2>
        <button type="button" class="modal-close" :aria-label="$t('profile.cancel')" @click="close">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div class="modal-body modal-body--scroll form-content">
        <!-- Nickname -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.nickname') }}</label>
          <div class="input-with-limit">
            <input type="text" v-model="form.displayName" maxlength="15" :placeholder="$t('profile.nickname')" class="form-input" :aria-label="$t('profile.nickname')">
            <span class="char-limit">{{ form.displayName.length }}/15</span>
          </div>
        </div>

        <!-- Self Introduction -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.selfIntroduction') }}</label>
          <textarea v-model="form.bio" :placeholder="$t('profile.tellUsAboutYourself')" class="form-textarea" rows="4" :aria-label="$t('profile.selfIntroduction')"></textarea>
        </div>

        <!-- Website -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.website') }}</label>
          <input type="text" v-model="form.website" class="form-input" :placeholder="$t('profile.urlPlaceholder')" :aria-label="$t('profile.website')">
        </div>

        <!-- Social Media -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.socialMedia') }}</label>
          <div class="social-row">
            <div class="social-input-wrap">
              <i class="fa-brands fa-x-twitter social-icon"></i>
              <input type="text" v-model="form.socialLinks.x" class="social-input" :placeholder="$t('profile.xUsername')" :aria-label="$t('profile.xUsername')">
            </div>
          </div>
          <div class="social-row">
            <div class="social-input-wrap">
              <i class="fa-brands fa-facebook social-icon"></i>
              <input type="text" v-model="form.socialLinks.facebook" class="social-input" :placeholder="$t('profile.facebookUsername')" :aria-label="$t('profile.facebookUsername')">
            </div>
          </div>
          <div class="social-row">
            <div class="social-input-wrap">
              <i class="fa-brands fa-instagram social-icon"></i>
              <input type="text" v-model="form.socialLinks.instagram" class="social-input" :placeholder="$t('profile.instagramUsername')" :aria-label="$t('profile.instagramUsername')">
            </div>
          </div>
        </div>

        <!-- Gender -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.gender') }}</label>
          <div class="split-row">
            <div class="radio-group">
              <label v-for="opt in genderOptions" :key="opt.value" class="radio-label">
                <input type="radio" :value="opt.value" v-model="form.gender" :aria-label="$t('profile.gender') + ': ' + opt.label">
                <span class="radio-text">{{ opt.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.location') }}</label>
          <div class="split-row">
            <select v-model="form.location" class="form-select full-width" :aria-label="$t('profile.location')">
              <option value="">----</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Japan">Japan</option>
              <option value="USA">USA</option>
            </select>
          </div>
        </div>

        <!-- Birth year -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.birthYear') }}</label>
          <div class="split-row">
            <select v-model="form.birthYear" class="form-select full-width" :aria-label="$t('profile.birthYear')">
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
        </div>

        <!-- Birthday -->
        <div class="form-group">
          <label class="field-label">{{ $t('profile.birthday') }}</label>
          <div class="split-row">
            <div class="birthday-inputs">
              <select v-model="form.birthdayMonth" class="form-select" :aria-label="$t('profile.birthday') + ' month'">
                <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
              <select v-model="form.birthdayDay" class="form-select" :aria-label="$t('profile.birthday') + ' day'">
                <option v-for="d in daysWithSuffix" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <footer class="edit-footer">
        <button type="button" class="modal-btn modal-btn--primary" @click="handleSave">{{ $t('profile.saveChanges') }}</button>
        <button type="button" class="modal-btn modal-btn--secondary" @click="close">{{ $t('profile.cancel') }}</button>
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
  color: var(--text);
}

.input-with-limit {
  position: relative;
}

.form-input, .form-textarea, .form-select, .social-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text);
  background: var(--surface-alt);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--accent, #0096fa);
  background: var(--surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, #0096fa) 10%, transparent);
}

.char-limit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--muted);
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
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.social-icon {
  width: 36px;
  text-align: center;
  color: var(--muted);
  font-size: 1rem;
}

.social-input {
  border: none;
  background: transparent;
  outline: none;
  color: var(--text);
}

.social-input::placeholder {
  color: var(--muted);
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

.edit-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--line);
}

/* Custom Scrollbar */
.modal-body--scroll::-webkit-scrollbar {
  width: 6px;
}
.modal-body--scroll::-webkit-scrollbar-track {
  background: transparent;
}
.modal-body--scroll::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 10px;
}
</style>
