import { ref, watch } from 'vue'

// LocalStorage key constant (not a secret)
const THEME_KEY = 'illuwrl-theme'

const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark')

// Apply class on init
if (isDark.value) {
  document.documentElement.classList.add('dark-theme')
}

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
  }

  function setTheme(dark) {
    isDark.value = dark
  }

  watch(isDark, (val) => {
    if (val) {
      document.documentElement.classList.add('dark-theme')
      localStorage.setItem(THEME_KEY, 'dark')
    } else {
      document.documentElement.classList.remove('dark-theme')
      localStorage.setItem(THEME_KEY, 'light')
    }
  })

  return {
    isDark,
    toggle,
    setTheme,
  }
}
