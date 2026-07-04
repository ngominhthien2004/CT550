import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import vi from './locales/vi.json'
import ja from './locales/ja.json'

/**
 * Load saved locale from localStorage, fall back to browser language, then 'en'
 */
function getInitialLocale() {
  try {
    const saved = localStorage.getItem('locale')
    if (saved && ['en', 'vi', 'ja'].includes(saved)) return saved
  } catch { /* ignore */ }

  const browserLang = navigator.language?.split('-')[0]
  if (browserLang && ['en', 'vi', 'ja'].includes(browserLang)) return browserLang

  return 'en'
}

const i18n = createI18n({
  legacy: false,          // use Composition API
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, vi, ja },
})

export default i18n
