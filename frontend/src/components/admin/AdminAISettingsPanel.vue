<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminApi } from '../../services/api'
import { translateError } from '../../utils/translateError.js'

const props = defineProps({
  activeTab: { type: String, required: true },
})

const { t } = useI18n()

const aiDetectionEnabled = ref(true)
const autoTaggingEnabled = ref(false)
const loading = ref(false)
const saving = ref(false)
const autoTagSaving = ref(false)
const error = ref('')
const successMsg = ref('')

async function loadSettings() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await adminApi.getAiSettings()
    aiDetectionEnabled.value = data.aiDetectionEnabled
    autoTaggingEnabled.value = data.autoTaggingEnabled
  } catch (fetchError) {
    error.value = translateError(fetchError, t, 'error.loadFailed')
  } finally {
    loading.value = false
  }
}

async function toggleAiDetection() {
  saving.value = true
  error.value = ''
  successMsg.value = ''
  try {
    const newValue = !aiDetectionEnabled.value
    const { data } = await adminApi.updateAiSettings({ aiDetectionEnabled: newValue })
    aiDetectionEnabled.value = data.aiDetectionEnabled
    successMsg.value = `AI detection ${data.aiDetectionEnabled ? 'enabled' : 'disabled'}`
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (toggleError) {
    error.value = translateError(toggleError, t, 'error.saveFailed')
    // revert on error
    aiDetectionEnabled.value = !aiDetectionEnabled.value
  } finally {
    saving.value = false
  }
}

async function toggleAutoTagging() {
  autoTagSaving.value = true
  error.value = ''
  successMsg.value = ''
  try {
    const newValue = !autoTaggingEnabled.value
    const { data } = await adminApi.updateAiSettings({ autoTaggingEnabled: newValue })
    autoTaggingEnabled.value = data.autoTaggingEnabled
    successMsg.value = `Auto-tagging ${data.autoTaggingEnabled ? 'enabled' : 'disabled'}`
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (toggleError) {
    error.value = translateError(toggleError, t, 'error.saveFailed')
    // revert on error
    autoTaggingEnabled.value = !autoTaggingEnabled.value
  } finally {
    autoTagSaving.value = false
  }
}

watch(() => props.activeTab, (tab) => {
  if (tab === 'ai') {
    loadSettings()
  }
})
</script>

<template>
  <section v-if="activeTab === 'ai'" id="admin-panel-ai" role="tabpanel" class="admin-panel">
    <div v-if="loading" class="admin-panel-loading">{{ $t('admin.loadingAiSettings') }}</div>

    <div v-else class="ai-settings-content">
      <h2>{{ $t('admin.aiFeatureSettings') }}</h2>
      <p class="text-secondary">{{ $t('admin.aiFeatureSettingsDesc') }}</p>

      <p v-if="error" class="error-note">{{ error }}</p>
      <p v-if="successMsg" class="success-note">{{ successMsg }}</p>

      <div class="ai-toggle-card">
        <div class="ai-toggle-info">
          <strong>{{ $t('admin.aiImageDetection') }}</strong>
          <span class="text-secondary small">
            {{ $t('admin.aiImageDetectionDesc') }}
          </span>
        </div>
        <label class="toggle-switch" :class="{ 'is-disabled': saving }">
          <input
            type="checkbox"
            :checked="aiDetectionEnabled"
            :disabled="saving"
            @change="toggleAiDetection"
            :aria-label="$t('admin.aiImageDetection')"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-label">{{ aiDetectionEnabled ? $t('admin.enabled') : $t('admin.disabled') }}</span>
        </label>
      </div>

      <div class="ai-toggle-card">
        <div class="ai-toggle-info">
          <strong>{{ $t('admin.autoImageTagging') }}</strong>
          <span class="text-secondary small">
            {{ $t('admin.autoImageTaggingDesc') }}
          </span>
        </div>
        <label class="toggle-switch" :class="{ 'is-disabled': autoTagSaving }">
          <input
            type="checkbox"
            :checked="autoTaggingEnabled"
            :disabled="autoTagSaving"
            @change="toggleAutoTagging"
            :aria-label="$t('admin.autoImageTagging')"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-label">{{ autoTaggingEnabled ? $t('admin.enabled') : $t('admin.disabled') }}</span>
        </label>
      </div>


    </div>
  </section>
</template>

<style scoped>
.ai-settings-content {
  max-width: 700px;
}
.ai-toggle-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  margin: 1rem 0;
}
.ai-toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
}
.toggle-switch.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.toggle-switch input {
  display: none;
}
.toggle-slider {
  width: 44px;
  height: 24px;
  background: var(--line);
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
}
.toggle-slider::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  top: 2px;
  background: var(--surface);
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-switch input:checked + .toggle-slider {
  background: #4caf50;
}
.toggle-switch input:checked + .toggle-slider::after {
  transform: translateX(20px);
}
.toggle-label {
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 60px;
}

.success-note {
  color: #155724;
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
.error-note {
  color: var(--danger);
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
</style>
