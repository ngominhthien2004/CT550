<script setup>
import { ref, watch } from 'vue'
import { adminApi } from '../../services/api'

const props = defineProps({
  activeTab: { type: String, required: true },
})

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
    error.value = fetchError?.response?.data?.message || 'Failed to load AI settings'
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
    error.value = toggleError?.response?.data?.message || 'Failed to update AI settings'
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
    error.value = toggleError?.response?.data?.message || 'Failed to update auto-tagging settings'
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
    <div v-if="loading" class="admin-panel-loading">Loading AI settings...</div>

    <div v-else class="ai-settings-content">
      <h2>AI Feature Settings</h2>
      <p class="text-secondary">Control the availability of AI-powered features and automation on the platform.</p>

      <p v-if="error" class="error-note">{{ error }}</p>
      <p v-if="successMsg" class="success-note">{{ successMsg }}</p>

      <div class="ai-toggle-card">
        <div class="ai-toggle-info">
          <strong>AI Image Detection</strong>
          <span class="text-secondary small">
            When disabled, users cannot submit images for AI detection analysis.
            Detect requests will return a 403 error.
          </span>
        </div>
        <label class="toggle-switch" :class="{ 'is-disabled': saving }">
          <input
            type="checkbox"
            :checked="aiDetectionEnabled"
            :disabled="saving"
            @change="toggleAiDetection"
            aria-label="Toggle AI image detection"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-label">{{ aiDetectionEnabled ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <div class="ai-toggle-card">
        <div class="ai-toggle-info">
          <strong>Auto Image Tagging</strong>
          <span class="text-secondary small">
            When enabled, uploaded images will be automatically analyzed to suggest relevant tags.
            Users will see auto-generated tag suggestions during upload.
          </span>
        </div>
        <label class="toggle-switch" :class="{ 'is-disabled': autoTagSaving }">
          <input
            type="checkbox"
            :checked="autoTaggingEnabled"
            :disabled="autoTagSaving"
            @change="toggleAutoTagging"
            aria-label="Toggle auto image tagging"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-label">{{ autoTaggingEnabled ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <div class="ai-status-info">
        <p><strong>Status:</strong>
          <span :class="aiDetectionEnabled ? 'text-success' : 'text-danger'">
            {{ aiDetectionEnabled ? '🟢 Active' : '🔴 Disabled' }}
          </span>
        </p>
        <p class="text-secondary small mb-0">
          This setting is managed by the admin account and applies globally.
        </p>
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
  border: 1px solid var(--line, #e0e0e0);
  border-radius: 8px;
  background: var(--surface, #fff);
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
  background: #ccc;
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
  background: white;
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
.ai-status-info {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--surface, #f9f9f9);
  border: 1px solid var(--line, #e0e0e0);
}
.success-note {
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
.error-note {
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
</style>
