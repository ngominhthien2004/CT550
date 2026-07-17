<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useI18n } from 'vue-i18n'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import api from '../services/api'
import { getApiErrorMessage } from '../utils/apiErrors'
import { useToast } from '../composables/useToast'
import { toggleNavCollapsed } from '../utils/viewNavigation'

const authStore = useAuthStore()
const { t } = useI18n()
const { showSuccess, showError } = useToast()
const isNavCollapsed = ref(true)

const activeTab = ref('account')

const tabs = [
  { id: 'account', label: 'Account' },
  { id: 'language', label: 'Language and location' },
  { id: 'display', label: 'Display settings' },
  { id: 'privacy', label: 'Privacy' },
]

const user = computed(() => authStore.user)

// ── Account ──
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordError = ref('')
const passwordSubmitting = ref(false)

async function changePassword() {
  passwordError.value = ''
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    passwordError.value = 'All password fields are required.'
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters.'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match.'
    return
  }
  passwordSubmitting.value = true
  try {
    await api.put('/users/profile/password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    showSuccess('Password updated successfully!')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (err) {
    passwordError.value = getApiErrorMessage(err, 'Failed to update password.')
  } finally {
    passwordSubmitting.value = false
  }
}

// ── Language & Location ──
const selectedLanguage = ref(localStorage.getItem('i18n_lang') || 'en')
const languages = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'vi', label: 'Tiếng Việt' },
]
function saveLanguage() {
  localStorage.setItem('i18n_lang', selectedLanguage.value)
  showSuccess('Language preference saved. Refresh to apply.')
}

// ── Display Settings ──
const showExplicit = ref(localStorage.getItem('r18_preference') === 'show')
const showAiContent = ref(localStorage.getItem('hide_ai_content') !== 'true')

function saveExplicit() {
  localStorage.setItem('r18_preference', showExplicit.value ? 'show' : '')
  showSuccess('Display settings saved.')
}

function saveAiContent() {
  localStorage.setItem('hide_ai_content', showAiContent.value ? '' : 'true')
  showSuccess('AI content display saved.')
}

// ── Privacy: Blocklist ──
const blockedUsers = ref([])
const blockedLoading = ref(true)
const blockedError = ref('')
const unblockingId = ref('')

async function loadBlockedUsers() {
  blockedLoading.value = true
  blockedError.value = ''
  try {
    const { data } = await api.get('/users/blocked')
    blockedUsers.value = data
  } catch (err) {
    blockedError.value = err?.response?.data?.message || 'Failed to load blocked users'
  } finally {
    blockedLoading.value = false
  }
}

async function toggleBlock(blockItem) {
  const blockedUserId = blockItem.blocked._id
  unblockingId.value = blockedUserId
  try {
    await api.delete(`/users/${blockedUserId}/block`)
    blockedUsers.value = blockedUsers.value.filter((u) => u.blocked._id !== blockedUserId)
    showSuccess(`Unblocked ${blockItem.blocked.displayName || blockItem.blocked.username}`)
  } catch (err) {
    showError(getApiErrorMessage(err, 'Failed to unblock user'))
  } finally {
    unblockingId.value = ''
  }
}

onMounted(() => {
  loadBlockedUsers()
})

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="settings-page">
      <div class="settings-layout">
        <!-- Left Sidebar -->
        <nav class="settings-sidebar">
          <h1 class="settings-heading">Settings</h1>
          <ul class="settings-nav">
            <li v-for="tab in tabs" :key="tab.id">
              <button
                type="button"
                class="settings-nav-item"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                <span>{{ tab.label }}</span>
              </button>
            </li>
          </ul>
        </nav>

        <!-- Right Content -->
        <div class="settings-content">

          <!-- ═══ Account ═══ -->
          <div v-if="activeTab === 'account'" class="settings-section">
            <div class="section-card">
              <h2 class="section-title">Account</h2>

              <div class="manage-account-card">
                <h3 class="manage-title">Manage IlluWrl account</h3>
                <p class="manage-desc">Manage your account information and login/security settings.</p>
                <router-link to="/account" class="manage-link">
                  Go to Profile page <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                </router-link>
              </div>

              <div class="section-divider"></div>

              <div class="info-row">
                <span class="info-label">Nickname</span>
                <div class="info-value">
                  <span class="info-text">{{ user?.displayName || user?.username }}</span>
                  <span class="info-hint">You can change your nickname from your <router-link to="/account" class="inline-link">Profile page</router-link>.</span>
                </div>
              </div>

              <div class="info-row">
                <span class="info-label">Email</span>
                <div class="info-value">
                  <span class="info-text">{{ user?.email || 'Not set' }}</span>
                  <span class="info-hint">Used for login and notifications.</span>
                </div>
              </div>

              <div class="section-divider"></div>

              <h3 class="subsection-title">Change Password</h3>
              <form @submit.prevent="changePassword" class="password-form">
                <div class="form-group">
                  <label for="current-password" class="form-label">Current Password</label>
                  <input id="current-password" v-model="passwordForm.currentPassword" type="password" class="form-input" required />
                </div>
                <div class="form-group">
                  <label for="new-password" class="form-label">New Password</label>
                  <input id="new-password" v-model="passwordForm.newPassword" type="password" class="form-input" required minlength="6" />
                </div>
                <div class="form-group">
                  <label for="confirm-password" class="form-label">Confirm New Password</label>
                  <input id="confirm-password" v-model="passwordForm.confirmPassword" type="password" class="form-input" required />
                </div>
                <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
                <button type="submit" class="btn-save" :disabled="passwordSubmitting">
                  {{ passwordSubmitting ? 'Updating...' : 'Update Password' }}
                </button>
              </form>
            </div>
          </div>

          <!-- ═══ Language and Location ═══ -->
          <div v-if="activeTab === 'language'" class="settings-section">
            <div class="section-card">
              <h2 class="section-title">Language and location</h2>

              <div class="info-row">
                <span class="info-label">Language</span>
                <div class="info-value">
                  <select v-model="selectedLanguage" class="form-select">
                    <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.label }}</option>
                  </select>
                  <button type="button" class="btn-save btn-save--small" @click="saveLanguage">Save</button>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="info-row">
                <span class="info-label">Country/Region</span>
                <div class="info-value">
                  <span class="info-text">Viet Nam</span>
                  <span class="info-hint">Used for regional content recommendations.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ Display Settings ═══ -->
          <div v-if="activeTab === 'display'" class="settings-section">
            <div class="section-card">
              <h2 class="section-title">Display settings</h2>

              <!-- Explicit content -->
              <div class="setting-row">
                <div class="setting-label-col">
                  <span class="setting-label">Explicit content</span>
                </div>
                <div class="setting-control-col">
                  <div class="toggle-row">
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="showExplicit" @change="saveExplicit" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Show explicit content (R-18)</span>
                  </div>
                  <div class="info-banner">
                    <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                    <span>You can choose whether to display works in lists or on work pages based on their ratings.</span>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <!-- AI-generated work -->
              <div class="setting-row">
                <div class="setting-label-col">
                  <span class="setting-label">AI-generated work</span>
                </div>
                <div class="setting-control-col">
                  <div class="toggle-row">
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="showAiContent" @change="saveAiContent" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Display</span>
                  </div>
                  <span class="info-hint">You can choose to hide AI-generated works on most pages.</span>
                </div>
              </div>


            </div>
          </div>

          <!-- ═══ Privacy ═══ -->
          <div v-if="activeTab === 'privacy'" class="settings-section">
            <div class="section-card">
              <h2 class="section-title">Privacy</h2>

              <!-- Block access -->
              <div class="setting-row">
                <div class="setting-label-col">
                  <span class="setting-label">Block access</span>
                </div>
                <div class="setting-control-col">
                  <p class="setting-desc">This will block specified accounts from accessing your page. You can block accounts directly from their profile page.</p>
                </div>
              </div>

              <div class="section-divider"></div>

              <!-- Blocked users list -->
              <div class="blocked-users-section">
                <h3 class="blocked-subtitle">Block list</h3>

                <p v-if="blockedLoading" class="state-text">Loading...</p>
                <p v-else-if="blockedError" class="state-text error">{{ blockedError }}</p>
                <p v-else-if="blockedUsers.length === 0" class="state-text">No blocked users.</p>

                <div v-else class="blocked-list">
                  <div v-for="blockedUser in blockedUsers" :key="blockedUser.blocked._id" class="blocked-row">
                    <div class="blocked-user-info">
                      <img
                        :src="blockedUser.blocked.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
                        :alt="blockedUser.blocked.displayName || blockedUser.blocked.username"
                        class="blocked-avatar"
                      />
                      <span class="blocked-name">{{ blockedUser.blocked.displayName || blockedUser.blocked.username }}</span>
                    </div>
                    <button
                      type="button"
                      class="toggle-switch"
                      :disabled="unblockingId === blockedUser.blocked._id"
                      @click="toggleBlock(blockedUser)"
                      :title="'Unblock ' + (blockedUser.blocked.displayName || blockedUser.blocked.username)"
                    >
                      <span class="toggle-slider active"></span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <!-- Include works in collections -->
              <div class="setting-row">
                <div class="setting-label-col">
                  <span class="setting-label">Include works in collections</span>
                </div>
                <div class="setting-control-col">
                  <div class="toggle-row">
                    <span class="toggle-label">Allow</span>
                  </div>
                  <span class="info-hint">You can choose whether others can include your works in their collections.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
/* ── Page Layout ── */
.settings-page {
  width: 100%;
}

.settings-layout {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
}

/* ── Left Sidebar (STICKY, fixed width) ── */
.settings-sidebar {
  position: sticky;
  top: 1rem;
  flex-shrink: 0;
  width: 220px;
}

.settings-heading {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 1rem;
  padding-left: 0.75rem;
}

.settings-nav {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
}

.settings-nav-item:hover {
  background: var(--surface-alt);
}

.settings-nav-item.active {
  background: var(--surface-alt);
  font-weight: 700;
  color: var(--accent);
}

/* ── Right Content (flex-grow) ── */
.settings-content {
  flex: 1;
  min-width: 0;
}

.settings-section {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1.75rem 2rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 1.25rem;
}

.section-divider {
  height: 1px;
  background: var(--line);
  margin: 1.25rem 0;
}

/* ── Manage Account Card ── */
.manage-account-card {
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.manage-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.3rem;
}

.manage-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0 0 0.6rem;
}

.manage-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.manage-link:hover { text-decoration: underline; }
.manage-link i { font-size: 0.7rem; }

/* ── Info Row ── */
.info-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 1.5rem;
  align-items: start;
  padding: 0.75rem 0;
}

.info-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  padding-top: 0.3rem;
}

.info-value {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.info-text {
  font-size: 0.9rem;
  color: var(--text);
}

.info-hint {
  font-size: 0.78rem;
  color: var(--muted);
}

.inline-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.inline-link:hover { text-decoration: underline; }

/* ── Setting Row (Pixiv-style) ── */
.setting-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  align-items: start;
  padding: 0.5rem 0;
}

.setting-label-col {
  padding-top: 0.3rem;
}

.setting-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.setting-control-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.toggle-label {
  font-size: 0.88rem;
  color: var(--text);
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.45;
}

.info-banner i {
  margin-top: 2px;
  flex-shrink: 0;
}

.btn-configure {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s;
  text-decoration: none;
  align-self: flex-start;
}

.btn-configure:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Blocked Users Section ── */
.blocked-users-section {
  padding: 0.5rem 0;
}

.blocked-subtitle {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.state-text {
  text-align: center;
  color: var(--muted);
  padding: 1.5rem;
  font-size: 0.88rem;
}

.state-text.error {
  color: var(--danger, #dc2626);
}

.blocked-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.blocked-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--line);
}

.blocked-row:last-child {
  border-bottom: none;
}

.blocked-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.blocked-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.blocked-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

/* ── Subsection ── */
.subsection-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.75rem;
}

/* ── Forms ── */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
}

.form-input,
.form-select {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  font-size: 0.88rem;
  background: var(--surface-alt);
  color: var(--text);
  transition: border-color 0.15s;
  max-width: 320px;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 118, 255, 0.1);
}

.form-error {
  color: var(--danger);
  font-size: 0.82rem;
  margin: 0;
}

.btn-save {
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-start;
}

.btn-save:hover:not(:disabled) { background: var(--accent-hover); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save--small { padding: 0.4rem 0.9rem; font-size: 0.78rem; }

/* ── Toggle Switch ── */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0;
}

.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--line);
  border-radius: 999px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-slider.active,
.toggle-switch input:checked + .toggle-slider { background: var(--accent); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }

/* Block button toggle always shows as active (blocked) */
.blocked-row .toggle-switch .toggle-slider {
  background: var(--accent);
}

.blocked-row .toggle-switch .toggle-slider::before {
  transform: translateX(18px);
}

.blocked-row .toggle-switch:hover .toggle-slider {
  background: var(--danger, #dc2626);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
    gap: 1rem;
  }

  .settings-sidebar {
    position: static;
    width: 100%;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 4px;
    padding-bottom: 0.5rem;
  }

  .settings-nav-item {
    white-space: nowrap;
    font-size: 0.82rem;
    padding: 0.5rem 0.65rem;
  }

  .section-card { padding: 1.25rem 1rem; }
  .info-row, .setting-row { grid-template-columns: 1fr; gap: 0.4rem; }
}
</style>
