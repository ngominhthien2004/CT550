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
