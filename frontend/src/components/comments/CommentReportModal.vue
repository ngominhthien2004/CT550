<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="comment-report-modal-title">
      <div class="modal-header">
        <h3 id="comment-report-modal-title">Report Comment</h3>
        <button class="btn-close" @click="$emit('close')" aria-label="Close">&times;</button>
      </div>
      <form @submit.prevent="submitReport">
        <div class="modal-body">
          <p class="text-muted mb-3">
            Why are you reporting this comment by "{{ comment?.user?.displayName || comment?.user?.username }}"?
          </p>
          <div class="form-group mb-3">
            <label>Reason</label>
            <select v-model="reason" class="form-select" required>
              <option value="" disabled>Select a reason</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group mb-3">
            <label>Description (optional)</label>
            <textarea v-model="description" class="form-control" rows="3" maxlength="1000" placeholder="Provide additional details..."></textarea>
          </div>
          <p v-if="error" class="text-danger small">{{ error }}</p>
          <p v-if="success" class="text-success small">{{ success }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" @click="$emit('close')" :disabled="submitting">Cancel</button>
          <button type="submit" class="btn btn-danger" :disabled="submitting || !reason">
            {{ submitting ? 'Submitting...' : 'Submit Report' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { reportComment } from '@/services/api'

const props = defineProps({
  visible: { type: Boolean, default: false },
  comment: { type: Object, default: null },
})
const emit = defineEmits(['close', 'reported'])

const reason = ref('')
const description = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

async function submitReport() {
  if (!reason.value || submitting.value) return
  submitting.value = true
  error.value = ''
  success.value = ''
  try {
    await reportComment(props.comment._id, {
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

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-container {
  background: var(--surface, #fff); border-radius: 12px; width: 480px; max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 1px solid var(--border, #eee);
}
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
.modal-body { padding: 24px; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 24px; border-top: 1px solid var(--border, #eee);
}
.form-group label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9rem; }
.form-select, .form-control {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border, #ddd);
  border-radius: 6px; font-size: 0.9rem; background: var(--input-bg, #fff);
}
.btn { padding: 8px 16px; border-radius: 6px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.btn-outline-secondary { border-color: var(--border, #ddd); background: transparent; }
.btn-danger { background: #dc3545; color: #fff; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
