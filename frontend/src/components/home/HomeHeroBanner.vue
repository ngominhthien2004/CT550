<script setup>
defineProps({
  slide: {
    type: Object,
    required: true,
  },
  kickerText: {
    type: String,
    default: 'Home',
  },
  description: {
    type: String,
    default: 'Discover featured illustrations, manga, and creator highlights in a denser editorial layout.',
  },
  bannerLink: {
    type: [String, Object],
    default: null,
  },
  primaryLink: {
    type: [String, Object],
    default: '/discovery',
  },
  primaryLabel: {
    type: String,
    default: 'Explore now',
  },
  secondaryLink: {
    type: [String, Object],
    default: '/rankings',
  },
  secondaryLabel: {
    type: String,
    default: 'View rankings',
  },
})
</script>

<template>
  <a v-if="bannerLink" :href="bannerLink" class="banner-link-wrapper">
    <article class="banner">
      <img :src="slide.image" :alt="slide.title" loading="lazy" />
      <div class="banner-overlay">
        <span class="banner-kicker">{{ kickerText }}</span>
        <h1>{{ slide.title }}</h1>
        <p>{{ description }}</p>

        <div class="banner-actions">
          <router-link :to="primaryLink" class="primary-link">{{ primaryLabel }}</router-link>
          <router-link :to="secondaryLink" class="secondary-link">{{ secondaryLabel }}</router-link>
        </div>
      </div>
    </article>
  </a>
  <article v-else class="banner">
    <img :src="slide.image" :alt="slide.title" loading="lazy" />
    <div class="banner-overlay">
      <span class="banner-kicker">{{ kickerText }}</span>
      <h1>{{ slide.title }}</h1>
      <p>{{ description }}</p>

      <div class="banner-actions">
        <router-link :to="primaryLink" class="primary-link">{{ primaryLabel }}</router-link>
        <router-link :to="secondaryLink" class="secondary-link">{{ secondaryLabel }}</router-link>
      </div>
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

.banner-kicker {
  width: fit-content;
  border-radius: 999px;
  padding: 0.24rem 0.55rem;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

.banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
}

.banner-link-wrapper {
  display: block;
  text-decoration: none;
  color: inherit;
}
.banner-link-wrapper:hover .banner {
  opacity: 0.97;
}

.primary-link,
.secondary-link {
  text-decoration: none;
  border-radius: 999px;
  padding: 0.46rem 0.78rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.primary-link {
  background: var(--surface);
  color: var(--text);
}

.secondary-link {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  backdrop-filter: blur(8px);
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
