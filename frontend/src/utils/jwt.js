// UTF-8 safe JWT payload decoder. Handles non-ASCII characters in the
// payload (e.g. Vietnamese user ids) which the native atob() would
// corrupt. Returns the parsed payload object, or null on any failure.

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getCurrentUserIdFromToken() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return null
  const payload = decodeJwtPayload(token)
  return payload?.id || payload?._id || null
}
