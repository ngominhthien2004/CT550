/**
 * Standard short date format used across the system.
 * Format: DD/MM/YYYY, HH:mm (24-hour) — e.g. "29/06/2026, 14:30"
 * If the input is invalid (null, undefined, empty, or non-date), returns an empty string.
 */
export function formatShortDate(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

/**
 * Date-only format (no time). Always outputs DD/MM/YYYY regardless of locale.
 * Returns an empty string for null/undefined/invalid input.
 * Example: "29/06/2026", "23/07/2026"
 */
export function formatDateOnly(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Long date format (numeric). Always outputs DD/MM/YYYY regardless of locale.
 * Returns an empty string for null/undefined/invalid input.
 * Example: "29/06/2026"
 */
export function formatLongDate(value, locale = 'en') {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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
