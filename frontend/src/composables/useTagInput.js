/**
 * Composable for tag chip input with API suggestion fetching.
 *
 * Usage:
 *   import { useTagInput } from '@/composables/useTagInput.js'
 *   const { tagInput, tags, tagSuggestions, tagSuggestionLoading,
 *           commitTag, removeTag, handleTagInputKeydown, handleSelectSuggestion,
 *           clearSuggestionTimer, watchTagInput } = useTagInput(fetchFn)
 *
 * @param {Function} fetchFn - async (keyword: string) => Promise<string[]>
 */
import { ref, watch } from 'vue'

export function useTagInput(fetchFn) {
  var tags = ref([])
  var tagInput = ref('')
  var tagSuggestions = ref([])
  var tagSuggestionLoading = ref(false)
  var suggestionTimer = null

  function normalizeTag(raw) {
    return raw.replace(/[^a-zA-Z0-9_\u00C0-\u1FFF\u2C00-\uD7FF\s-]/g, '').trim()
  }

  function commitTag() {
    var raw = tagInput.value
    var normalized = normalizeTag(raw)
    if (normalized && !tags.value.includes(normalized)) {
      tags.value.push(normalized)
    }
    tagInput.value = ''
    tagSuggestions.value = []
    clearSuggestionTimer()
  }

  function removeTag(index) {
    tags.value.splice(index, 1)
  }

  function handleTagInputKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitTag()
    } else if (event.key === 'Backspace' && tagInput.value === '' && tags.value.length > 0) {
      tags.value.pop()
    }
  }

  function handleSelectSuggestion(tag) {
    if (!tags.value.includes(tag)) {
      tags.value.push(tag)
    }
    tagInput.value = ''
    tagSuggestions.value = []
    clearSuggestionTimer()
  }

  function clearSuggestionTimer() {
    if (suggestionTimer !== null) {
      clearTimeout(suggestionTimer)
      suggestionTimer = null
    }
  }

  /**
   * Call this during setup() to activate the debounced suggestion watcher.
   * Returns the watcher handle for explicit cleanup.
   */
  function watchTagInput() {
    return watch(tagInput, function (val) {
      clearSuggestionTimer()
      var trimmed = val.trim()
      if (!trimmed) {
        tagSuggestions.value = []
        tagSuggestionLoading.value = false
        return
      }
      tagSuggestionLoading.value = true
      suggestionTimer = setTimeout(function () {
        fetchFn(trimmed).then(function (results) {
          if (Array.isArray(results)) {
            tagSuggestions.value = results.filter(function (t) { return !tags.value.includes(t) })
          } else {
            tagSuggestions.value = []
          }
        }).catch(function () {
          tagSuggestions.value = []
        }).finally(function () {
          tagSuggestionLoading.value = false
        })
      }, 180)
    })
  }

  return {
    tagInput,
    tags,
    tagSuggestions,
    tagSuggestionLoading,
    commitTag,
    removeTag,
    handleTagInputKeydown,
    handleSelectSuggestion,
    clearSuggestionTimer,
    watchTagInput,
  }
}
