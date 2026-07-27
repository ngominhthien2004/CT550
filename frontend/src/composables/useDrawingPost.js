/**
 * useDrawingPost — "Post to Upload" dialog for the drawing tool.
 *
 * @param {object} ctx - Context with:
 *   exportToBlob        - async () => Blob | null
 *   confirmGoHomeIntent - () => void
 *   clearGoHomeIntent   - () => void
 *   getTags             - API function: ({ q, limit }) => Promise
 *   createArtwork       - API function: (FormData) => Promise
 */
import { ref, watch } from 'vue'

export function useDrawingPost(ctx) {
  var { exportToBlob, confirmGoHomeIntent, clearGoHomeIntent, getTags, createArtwork } = ctx

  // ─── State ─────────────────────────────────────────────────────────
  var showPostDialog = ref(false)
  var postTitle = ref('')
  var postType = ref('illust')
  var postAgeRating = ref('all')
  var postTags = ref([])
  var postTagInput = ref('')
  var postTagSuggestions = ref([])
  var postTagSuggestionLoading = ref(false)
  var postSubmitting = ref(false)
  var postError = ref('')
  var postPreviewUrl = ref('')
  var postTagSuggestionTimer = null

  // ─── Functions ─────────────────────────────────────────────────────

  function revokePostPreview() {
    if (postPreviewUrl.value) {
      URL.revokeObjectURL(postPreviewUrl.value)
      postPreviewUrl.value = ''
    }
  }

  async function openPostDialog() {
    revokePostPreview()
    postTitle.value = ''
    postType.value = 'illust'
    postAgeRating.value = 'all-ages'
    postTags.value = []
    postTagInput.value = ''
    postError.value = ''
    var blob = await exportToBlob()
    if (blob) {
      postPreviewUrl.value = URL.createObjectURL(blob)
    }
    showPostDialog.value = true
  }

  function closePostDialog() {
    revokePostPreview()
    showPostDialog.value = false
  }

  // ─── Tags ──────────────────────────────────────────────────────────
  function normalizePostTag(raw) {
    return String(raw || '').trim().replace(/^#+/, '').replace(/[\s-]+/g, '_').toLowerCase()
  }

  function commitPostTag(raw) {
    var tag = normalizePostTag(raw)
    if (!tag) return
    if (postTags.value.includes(tag)) { postTagInput.value = ''; return }
    if (postTags.value.length >= 10) { postError.value = 'Tối đa 10 tags'; return }
    postTags.value.push(tag)
    postTagInput.value = ''
    postError.value = ''
  }

  function removePostTag(index) {
    postTags.value.splice(index, 1)
  }

  function handlePostTagInputKeydown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitPostTag(postTagInput.value)
      postTagSuggestions.value = []
    } else if (e.key === ' ') {
      e.preventDefault()
      if (postTagInput.value.trim()) {
        commitPostTag(postTagInput.value)
        postTagSuggestions.value = []
      }
    }
  }

  function clearPostTagSuggestionTimer() {
    if (postTagSuggestionTimer) {
      clearTimeout(postTagSuggestionTimer)
      postTagSuggestionTimer = null
    }
  }

  async function fetchPostTagSuggestions(keyword) {
    postTagSuggestionLoading.value = true
    try {
      var res = await getTags({ q: keyword, limit: 8 })
      var raw = Array.isArray(res.data) ? res.data : []
      postTagSuggestions.value = raw
        .map(function (item) {
          var name = normalizePostTag(item.name || item._id || '')
          return { name: name, usageCount: Number(item.usageCount || 0) }
        })
        .filter(function (s) { return s.name && !postTags.value.includes(s.name) })
    } catch (_e) {
      postTagSuggestions.value = []
    } finally {
      postTagSuggestionLoading.value = false
    }
  }

  function handleSelectPostTagSuggestion(suggestion) {
    commitPostTag(suggestion)
    postTagSuggestions.value = []
  }

  // ─── Watch: debounced tag suggestions ──────────────────────────────
  watch(postTagInput, function (value) {
    clearPostTagSuggestionTimer()
    var keyword = normalizePostTag(value).replace(/_/g, ' ')
    if (!keyword) {
      postTagSuggestions.value = []
      postTagSuggestionLoading.value = false
      return
    }
    postTagSuggestionTimer = setTimeout(function () {
      fetchPostTagSuggestions(keyword)
    }, 180)
  })

  // ─── Submit ────────────────────────────────────────────────────────
  async function submitPost(router) {
    if (!postTitle.value.trim()) { postError.value = 'Title is required'; return }
    postSubmitting.value = true
    postError.value = ''
    try {
      var blob = await exportToBlob()
      if (!blob) throw new Error('Failed to export drawing')

      var fd = new FormData()
      fd.append('images', blob, 'drawing.png')
      fd.append('title', postTitle.value.trim())
      fd.append('type', postType.value)
      fd.append('ageRating', postAgeRating.value)
      if (postTags.value.length > 0) {
        for (var ti = 0; ti < postTags.value.length; ti++) {
          fd.append('tags', postTags.value[ti].trim())
        }
      }

      var res = await createArtwork(fd)
      var artworkId = res.data?.artwork?._id || res.data?._id
      if (artworkId) {
        closePostDialog()
        confirmGoHomeIntent()
        router.push('/artworks/' + artworkId)
      }
    } catch (err) {
      clearGoHomeIntent()
      postError.value = err?.response?.data?.message || err.message || 'Failed to post drawing'
    } finally {
      postSubmitting.value = false
    }
  }

  // ─── Return ────────────────────────────────────────────────────────
  return {
    showPostDialog,
    postTitle,
    postType,
    postAgeRating,
    postTags,
    postTagInput,
    postTagSuggestions,
    postTagSuggestionLoading,
    postSubmitting,
    postError,
    postPreviewUrl,
    revokePostPreview,
    openPostDialog,
    closePostDialog,
    normalizePostTag,
    commitPostTag,
    removePostTag,
    handlePostTagInputKeydown,
    clearPostTagSuggestionTimer,
    fetchPostTagSuggestions,
    handleSelectPostTagSuggestion,
    submitPost,
  }
}
