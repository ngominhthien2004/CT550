/**
 * Standard short date format used across the system.
 * Format: MM/DD, HH:mm (24-hour) — e.g. "06/29, 14:30"
 * If the input is invalid (null, undefined, empty, or non-date), returns an empty string.
 */
export function formatShortDate(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day}, ${hours}:${minutes}`
}

/**
 * Date-only format (no time). Always outputs MM/DD regardless of locale.
 * Returns an empty string for null/undefined/invalid input.
 * Example: "06/29", "07/23"
 */
export function formatDateOnly(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

/**
 * Long date format with full month name. Useful for hero sections and
 * detail pages that want a more readable presentation.
 * Example: "June 29, 2026" (en) / "2026年6月29日" (ja)
 */
export function formatLongDate(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Relative time format (e.g., "2 hours ago", "Yesterday", "3 days ago").
 * Falls back to short date for dates older than 7 days.
 */
export function formatRelativeTime(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''

  const now = Date.now()
  const diff = now - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatShortDate(value, locale)
}
