import { ref } from 'vue'

/**
 * Composable for image file selection with client-side validation.
 *
 * @param {Object}   opts
 * @param {number}   opts.maxSize    – bytes (default 8 MB)
 * @param {number}   opts.maxWidth   – pixels  (0 = no limit)
 * @param {number}   opts.maxHeight  – pixels  (0 = no limit)
 * @param {string[]} opts.formats    – accepted MIME types
 */
export function useImageUpload(opts = {}) {
  const {
    maxSize = 8 * 1024 * 1024,
    maxWidth = 0,
    maxHeight = 0,
    formats = ['image/jpeg', 'image/png', 'image/gif'],
  } = opts

  const file = ref(null)
  const preview = ref('')
  const error = ref('')

  function reset() {
    if (preview.value && preview.value.startsWith('blob:')) {
      URL.revokeObjectURL(preview.value)
    }
    file.value = null
    preview.value = ''
    error.value = ''
  }

  /**
   * Set preview to an existing URL (e.g. current avatar/cover from server).
   */
  function setPreview(url) {
    preview.value = url || ''
  }

  /**
   * Handle a native <input type="file"> change event.
   * Validates format, size, and optionally resolution.
   */
  function selectFile(event) {
    const rawFile = event.target.files?.[0]
    if (!rawFile) return

    error.value = ''

    // Format
    if (!formats.includes(rawFile.type)) {
      error.value = `Invalid format. Accepted: ${formats.map((f) => f.split('/')[1].toUpperCase()).join(', ')}.`
      return
    }

    // Size
    if (rawFile.size > maxSize) {
      const mb = (maxSize / (1024 * 1024)).toFixed(0)
      error.value = `File size exceeds ${mb}MB.`
      return
    }

    // Resolution (async — uses Image element)
    if (maxWidth > 0 || maxHeight > 0) {
      const img = new Image()
      img.onload = () => {
        if ((maxWidth && img.width > maxWidth) || (maxHeight && img.height > maxHeight)) {
          error.value = `Resolution exceeds ${maxWidth} x ${maxHeight}. Yours is ${img.width}x${img.height}.`
          URL.revokeObjectURL(img.src)
          return
        }
        preview.value = img.src
        file.value = rawFile
      }
      img.onerror = () => {
        error.value = 'Failed to read image file.'
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(rawFile)
    } else {
      // No resolution check needed
      preview.value = URL.createObjectURL(rawFile)
      file.value = rawFile
    }
  }

  /**
   * Build a FormData with the selected file attached under `fieldName`.
   * Returns null when no file is selected.
   */
  function toFormData(fieldName) {
    if (!file.value) return null
    const fd = new FormData()
    fd.append(fieldName, file.value)
    return fd
  }

  return { file, preview, error, reset, setPreview, selectFile, toFormData }
}
