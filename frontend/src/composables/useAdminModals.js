import { ref } from 'vue'

export function useAdminModals() {
  const confirmModal = ref({ show: false, title: '', message: '', confirmLabel: 'Confirm', confirmClass: 'modal-btn--accent', onConfirm: null })
  const promptModal = ref({ show: false, title: '', message: '', placeholder: '', defaultValue: '', confirmLabel: 'OK', onConfirm: null })

  function handleConfirm() {
    const fn = confirmModal.value.onConfirm
    confirmModal.value.show = false
    fn?.()
  }

  function handleConfirmCancel() {
    confirmModal.value.show = false
  }

  function handlePromptConfirm(val) {
    const fn = promptModal.value.onConfirm
    promptModal.value.show = false
    fn?.(val)
  }

  function handlePromptCancel() {
    promptModal.value.show = false
  }

  /** Show a confirm modal with config. Returns a promise that resolves when confirmed. */
  function showConfirm(config) {
    confirmModal.value = { ...confirmModal.value, ...config, show: true }
  }

  /** Show a prompt modal with config. Returns a promise that resolves with the input value. */
  function showPrompt(config) {
    promptModal.value = { ...promptModal.value, ...config, show: true }
  }

  return {
    confirmModal, promptModal,
    handleConfirm, handleConfirmCancel,
    handlePromptConfirm, handlePromptCancel,
    showConfirm, showPrompt,
  }
}
