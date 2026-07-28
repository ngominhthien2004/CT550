import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'vite.config.js',
      'scripts/**',
      'src/_archive/**',
      '**/*.spec.js',
      '**/*.test.js',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // Vue 3 recommended rules
  ...pluginVue.configs['flat/recommended'],

  // Custom rules
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        navigator: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        atob: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly',
        URLSearchParams: 'readonly',
        DataTransfer: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/attributes-order': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
];
