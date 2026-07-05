<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  placeholderCount: { type: Number, default: 0 },
})
</script>

<template>
  <p v-if="loading" class="state-note">{{ $t('search.loadingResults') }}</p>
  <p v-else-if="error" class="state-note error">{{ error }}</p>

  <p v-else-if="!items.length" class="state-note">{{ $t('search.noWorksFilter') }}</p>

  <div v-else class="result-grid-wrap">
    <article v-for="item in items" :key="item._id" class="result-card">
      <router-link :to="`/artworks/${item._id}`" class="thumb-link">
        <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
        <div v-else class="thumb-fallback"></div>
      </router-link>
      <router-link :to="`/artworks/${item._id}`" class="title-link">{{ item.title }}</router-link>
      <p class="author-name">{{ item.user?.displayName || item.user?.username || $t('profile.unknownArtist') }}</p>
    </article>

    <article v-for="idx in placeholderCount" :key="`placeholder-${idx}`" class="result-card placeholder-card">
      <div class="thumb-placeholder"></div>
      <div class="line-placeholder long"></div>
      <div class="line-placeholder short"></div>
    </article>
  </div>
</template>

<style scoped>
.result-grid-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.result-card {
  display: flex;
  flex-direction: column;
}

.thumb-link {
  display: block;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-alt);
}

.thumb-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  background: var(--surface-alt);
}

.title-link {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title-link:hover {
  text-decoration: underline;
}

.author-name {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--muted);
}

.placeholder-card {
  opacity: 0.5;
}

.thumb-placeholder {
  aspect-ratio: 1;
  border-radius: 6px;
  background: var(--line);
  animation: pulse 1.5s ease-in-out infinite;
}

.line-placeholder {
  height: 0.7rem;
  border-radius: 4px;
  background: var(--line);
  margin-top: 0.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.line-placeholder.long { width: 80%; }
.line-placeholder.short { width: 50%; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.state-note {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}
</style>
