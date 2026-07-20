<script setup>
import SkeletonLoader from '../common/SkeletonLoader.vue'

defineProps({
  slide: {
    type: Object,
    required: true,
  },
  description: {
    type: String,
    default: 'Discover featured illustrations, manga, and creator highlights in a denser editorial layout.',
  },
  bannerLink: {
    type: [String, Object],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <SkeletonLoader v-if="loading" type="banner" />
  <a v-else-if="bannerLink" :href="bannerLink" class="banner-link-wrapper">
    <article class="banner">
      <img :src="slide.image" :alt="slide.title" loading="lazy" />
      <div class="banner-overlay">
        <h1>{{ slide.title }}</h1>
        <p>{{ description }}</p>
      </div>
    </article>
  </a>
  <article v-else class="banner">
    <img :src="slide.image" :alt="slide.title" loading="lazy" />
    <div class="banner-overlay">
      <h1>{{ slide.title }}</h1>
        <p>{{ description }}</p>
      </div>
    </article>
</template>

<style scoped>
.banner {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  aspect-ratio: 7 / 2;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: end;
  gap: 0.4rem;
  padding: 0.82rem 0.95rem;
  background: linear-gradient(180deg, rgba(7, 12, 24, 0.08), rgba(7, 12, 24, 0.72));
  color: #fff;
}

.banner-overlay h1 {
  color: #fff;
  font-size: 1.2rem;
  line-height: 1.04;
  max-width: 24ch;
}

.banner-overlay p {
  max-width: 42ch;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.75rem;
  line-height: 1.4;
}

.banner-link-wrapper {
  display: block;
  text-decoration: none;
  color: inherit;
}
.banner-link-wrapper:hover .banner {
  opacity: 0.97;
}

@media (max-width: 920px) {
  .banner {
    aspect-ratio: 5 / 2;
  }

  .banner-overlay h1 {
    font-size: 1.05rem;
  }

  .banner-overlay p {
    display: none;
  }
}
</style>
