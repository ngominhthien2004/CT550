<script setup>
import { useLanguageStore } from '../../stores/language.store'

const languageStore = useLanguageStore()
</script>

<template>
  <div class="lang-switcher">
    <p class="menu-label" role="presentation">{{ $t('topbar.language') }}</p>
    <button
      v-for="lang in languageStore.availableLanguages"
      :key="lang.code"
      type="button"
      class="dd-item lang-option"
      :class="{ active: languageStore.currentLocale === lang.code }"
      role="menuitem"
      @click="languageStore.setLocale(lang.code)"
    >
      <span class="lang-native">{{ lang.nativeLabel }}</span>
      <span class="lang-code">({{ lang.code.toUpperCase() }})</span>
    </button>
  </div>
</template>

<style scoped>
.lang-switcher {
  margin-top: 0;
}

.menu-label {
  margin: 0.7rem 0 0;
  padding: 0.28rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 1rem;
  border: none;
  background: none;
  color: var(--text);
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.lang-option:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.lang-option.active {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  font-weight: 600;
}

.lang-code {
  font-size: 0.75rem;
  color: var(--muted);
}

.lang-option.active .lang-code {
  color: var(--accent);
}
</style>
