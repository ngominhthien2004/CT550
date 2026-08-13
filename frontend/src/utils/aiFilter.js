/**
 * Client-side AI artwork filtering utility.
 * Reads the `hide_ai_content` preference from localStorage
 * and filters out artworks that have the "ai" tag.
 */

const AI_TAG_NAME = 'ai'

/**
 * Check if an artwork is AI-generated (has the "ai" tag).
 */
export function isAIArtwork(artwork) {
  if (!artwork || !Array.isArray(artwork.tags)) return false
  return artwork.tags.some((tag) => {
    const name = typeof tag === 'string' ? tag : tag?.name
    return name === AI_TAG_NAME
  })
}

/**
 * Check if the current user has chosen to hide AI content.
 */
export function shouldHideAI() {
  return localStorage.getItem('hide_ai_content') === 'true'
}

/**
 * Filter an array of artworks, removing AI ones if the user preference says so.
 * @param {Array} artworks
 * @returns {Array} filtered artworks
 */
export function filterAIArtworks(artworks) {
  if (!Array.isArray(artworks)) return []
  if (!shouldHideAI()) return artworks
  return artworks.filter((a) => !isAIArtwork(a))
}

/**
 * Vue composable for reactive AI filtering.
 * Usage: const { hideAI, filterArtworks } = useAIFilter()
 */
export function useAIFilter() {
  const hideAI = shouldHideAI()

  function filterArtworks(artworks) {
    if (!hideAI) return artworks
    return artworks.filter((a) => !isAIArtwork(a))
  }

  return { hideAI, filterArtworks }
}
