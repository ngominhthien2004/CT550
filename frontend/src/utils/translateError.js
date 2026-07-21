import i18n from '../i18n'

/**
 * Translates a backend API error into a localized message.
 *
 * @param {Error} err - The error object from axios (caught in catch block)
 * @param {Function} [t] - vue-i18n's `t()` function from useI18n() (optional, falls back to i18n.global.t)
 * @param {string} [fallback] - Optional fallback key (default 'error.loadFailed')
 * @returns {string} Localized error message
 *
 * Priority:
 * 1. `err.response.data.code` → mapped via `error.{code}` (e.g. 'error.TAG_NAME_REQUIRED')
 * 2. `err.response.data.message` (backend's English message, shown raw)
 * 3. `t(fallback)` (component-level fallback)
 * 4. 'error.loadFailed' (global fallback)
 * 5. 'Something went wrong' (last resort)
 */
export function translateError(err, t, fallback) {
  if (!err) return t?.('error.general') || i18n.global.t('error.general') || 'Something went wrong'

  const translateFn = t || i18n.global.t
  const code = err?.response?.data?.code

  if (code && translateFn) {
    const translated = translateFn(`error.${code}`)
    // vue-i18n returns the key itself if no translation found
    if (translated !== `error.${code}`) return translated
  }

  return (
    err?.response?.data?.message ||
    translateFn(fallback || 'error.loadFailed') ||
    'Something went wrong'
  )
}
