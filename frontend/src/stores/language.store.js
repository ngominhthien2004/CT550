import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export const useLanguageStore = defineStore('language', () => {
  const { locale } = useI18n()

  const availableLanguages = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'vi', label: 'Tiếng Việt', nativeLabel: 'Tiếng Việt' },
    { code: 'ja', label: '日本語', nativeLabel: '日本語' },
  ]

  const currentLocale = ref(locale.value)

  function setLocale(code) {
    locale.value = code
    currentLocale.value = code
    try {
      localStorage.setItem('locale', code)
    } catch { /* ignore */ }
    document.documentElement.lang = code
  }

  // Sync with vue-i18n locale changes
  watch(locale, (newVal) => {
    currentLocale.value = newVal
    document.documentElement.lang = newVal
  })

  // Set initial lang attribute
  document.documentElement.lang = locale.value

  return {
    availableLanguages,
    currentLocale,
    setLocale,
  }
})
