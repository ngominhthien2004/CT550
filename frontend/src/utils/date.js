/**
 * Standard short date format used across the system.
 * Format: MM/DD/YYYY, HH:mm (24-hour) — e.g. "06/29/2026, 14:30"
 * If the input is invalid (null, undefined, empty, or non-date), returns an empty string.
 */
export function formatShortDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Date-only format (no time). Uses the viewer's locale so Japanese/Vietnamese
 * users see native month names instead of English. Returns an empty string for
 * null/undefined/invalid input.
 * Example: "Jun 29, 2026" (en) / "2026年6月29日" (ja) / "29 thg 6, 2026" (vi)
 */
export function formatDateOnly(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Long date format with full month name. Useful for hero sections and
 * detail pages that want a more readable presentation.
 * Example: "June 29, 2026" (en) / "2026年6月29日" (ja)
 */
export function formatLongDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Relative time format (e.g., "2 hours ago", "Yesterday", "3 days ago").
 * Falls back to short date for dates older than 7 days.
 */
export function formatRelativeTime(value) {
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
  return formatShortDate(value)
}
