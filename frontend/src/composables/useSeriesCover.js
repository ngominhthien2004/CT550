import { computed } from 'vue'

/**
 * Resolve the cover image URL for a series.
 * - Uses `coverImage` if present
 * - Falls back to the first artwork's primary image if `coverImage` is empty
 * - Returns empty string if no cover and no artworks
 *
 * Accepts a ref, computed, or plain object. Unwraps refs automatically.
 *
 * @param {import('vue').Ref|object} seriesRef
 * @returns {import('vue').ComputedRef<string>}
 */
export function useSeriesCover(seriesRef) {
  return computed(() => {
    const s = seriesRef?.value !== undefined ? seriesRef.value : seriesRef
    if (!s) return ''
    if (s.coverImage) return s.coverImage
    const first = Array.isArray(s.artworks) ? s.artworks[0] : null
    const imgs = first?.images
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0]
    return ''
  })
}
