<template>
  <Teleport to="body">
    <div v-if="visible" class="report-modal-overlay" @click="$emit('close')">
      <div class="report-modal-container" role="dialog" aria-modal="true" :aria-labelledby="modalId + '-title'" @click.stop>
        <div class="report-modal-header">
          <h3 :id="modalId + '-title'">{{ config.title }}</h3>
          <button type="button" class="report-modal-close" @click="$emit('close')" aria-label="Close">&times;</button>
        </div>
        <form @submit.prevent="submitReport">
          <div class="report-modal-body">
            <p class="report-modal-desc" v-html="config.description"></p>
            <div class="report-modal-field">
              <label>Reason</label>
              <select v-model="reason" class="form-select" required aria-label="Report reason">
                <option value="" disabled>Select a reason</option>
                <option v-for="opt in config.reasonOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="report-modal-field">
              <label>Description (optional)</label>
              <textarea v-model="description" class="form-control" rows="3" maxlength="1000" placeholder="Provide additional details..." aria-label="Report description"></textarea>
            </div>
            <p v-if="error" class="report-modal-error">{{ error }}</p>
            <p v-if="success" class="report-modal-success">{{ success }}</p>
          </div>
          <div class="report-modal-footer">
            <button type="button" class="action-pill" @click="$emit('close')" :disabled="submitting">Cancel</button>
            <button type="submit" class="action-pill action-pill--post" :disabled="submitting || !reason">
              {{ submitting ? 'Submitting...' : 'Submit Report' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { reportArtwork, reportComment, reportApi } from '@/services/api'

const props = defineProps({
  visible: { type: Boolean, default: false },
  reportType: { type: String, required: true },
  target: { type: Object, default: null },
})
const emit = defineEmits(['close', 'reported'])

const reason = ref('')
const description = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

const modalId = computed(() => props.reportType + '-report-modal')

const config = computed(() => {
  const configs = {
    artwork: {
      title: 'Report Artwork',
      description: 'Why are you reporting "' + (props.target?.title || '') + '"?',
      reasonOptions: [
        { value: 'spam', label: 'Spam' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'copyright', label: 'Copyright infringement' },
        { value: 'harassment', label: 'Harassment' },
        { value: 'nsfw', label: 'Missing age rating / NSFW' },
        { value: 'other', label: 'Other' },
      ],
      apiCall: (id, payload) => reportArtwork(id, payload),
    },
    comment: {
      title: 'Report Comment',
      description: 'Why are you reporting this comment by "' + (props.target?.user?.displayName || props.target?.user?.username || '') + '"?',
      reasonOptions: [
        { value: 'spam', label: 'Spam' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'harassment', label: 'Harassment' },
        { value: 'other', label: 'Other' },
      ],
      apiCall: (id, payload) => reportComment(id, payload),
    },
    user: {
      title: 'Report User',
      description: 'Why are you reporting "' + (props.target?.displayName || props.target?.username || '') + '"?',
      reasonOptions: [
        { value: 'spam', label: 'Spam' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'harassment', label: 'Harassment' },
        { value: 'impersonation', label: 'Impersonation' },
        { value: 'other', label: 'Other' },
      ],
      apiCall: (id, payload) => reportApi.reportUser(id, payload),
    },
  }
  return configs[props.reportType] || configs.artwork
})

async function submitReport() {
  if (!reason.value || submitting.value) return
  submitting.value = true
  error.value = ''
  success.value = ''
  try {
    await config.value.apiCall(props.target._id, {
      reason: reason.value,
      description: description.value,
    })
    success.value = 'Report submitted. Thank you for helping keep the community safe!'
    reason.value = ''
    description.value = ''
    setTimeout(() => {
      emit('reported')
      emit('close')
    }, 1500)
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Failed to submit report'
  } finally {
    submitting.value = false
  }
}
</script>

<style>
.report-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.report-modal-container {
  background: var(--surface, #fff);
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.report-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, #eee);
}
.report-modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--brand);
}
.report-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: var(--muted);
}
.report-modal-close:hover {
  color: var(--danger);
}
.report-modal-body {
  padding: 24px;
}
.report-modal-desc {
  color: var(--muted);
  margin-bottom: 1rem;
}
.report-modal-field {
  margin-bottom: 1rem;
}
.report-modal-field label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 0.9rem;
}
.report-modal-field .form-select,
.report-modal-field .form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border, #ddd);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--input-bg, #fff);
}
.report-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid var(--border, #eee);
}
.report-modal-error {
  color: var(--danger, #dc3545);
  font-size: 0.85rem;
}
.report-modal-success {
  color: var(--success, #28a745);
  font-size: 0.85rem;
}
</style>
