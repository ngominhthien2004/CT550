<script setup>
defineProps({
  slide: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="banner">
    <img :src="slide.image" :alt="slide.title" loading="lazy" />
    <div class="banner-overlay">
      <span class="banner-kicker">Home</span>
      <h1>{{ slide.title }}</h1>
      <p>Discover featured illustrations, manga, and creator highlights in a denser editorial layout.</p>
      <div class="banner-actions">
        <router-link to="/discovery" class="primary-link">Explore now</router-link>
        <router-link to="/rankings" class="secondary-link">View rankings</router-link>
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
  max-width: 13ch;
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

.primary-link,
.secondary-link {
  text-decoration: none;
  border-radius: 999px;
  padding: 0.46rem 0.78rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.primary-link {
  background: #fff;
  color: #0f172a;
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
