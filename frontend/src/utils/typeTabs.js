/**
 * Shared type label map and helpers for content type filtering.
 * Standard order: illust → manga → gif → novel
 */

export const typeLabelMap = {
  illust: 'Illustration',
  manga: 'Manga',
  gif: 'GIF',
  novel: 'Novel',
}

/**
 * Build an array of { value, label, count } — only types that have items.
 * Skips types with 0 count so the tab row stays clean.
 */
export function buildTypeTabs(items, getType) {
  const bucket = new Map()
  items.forEach((item) => {
    const type = getType(item)
    if (!typeLabelMap[type]) return
    bucket.set(type, (bucket.get(type) || 0) + 1)
  })
  return Object.keys(typeLabelMap)
    .filter((type) => bucket.has(type))
    .map((type) => ({ value: type, label: typeLabelMap[type], count: bucket.get(type) || 0 }))
}

/**
 * Filter items array by selected type (activeType.value could be '' or 'all' for no filter).
 */
export function filterByType(items, selectedType, getType) {
  if (!selectedType || selectedType === 'all') return items
  return items.filter((item) => getType(item) === selectedType)
}
