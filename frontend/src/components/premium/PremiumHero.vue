<script setup>
import heroImage from '../../assets/hero.png'

defineProps({
  moments: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="premium-hero">
    <div class="premium-hero-media">
      <img :src="heroImage" alt="IlluWrl Premium showcase" />
    </div>
    <div class="premium-hero-overlay"></div>
    <div class="premium-hero-content">
      <p class="premium-kicker">IlluWrl Premium</p>
      <h1>Discover the strongest work sooner. Track your taste deeper. Create with more signal.</h1>
      <p class="premium-intro">
        Premium turns IlluWrl into a sharper space for browsing illustrations, reading manga, following novels, and understanding what your audience actually loves.
      </p>
      <div class="premium-hero-actions">
        <router-link to="/signup?plan=premium" class="hero-primary">Start 30-day trial</router-link>
        <a href="#compare" class="hero-secondary">See everything included</a>
      </div>
    </div>
    <div class="premium-moment-strip">
      <article v-for="moment in moments" :key="moment.label">
        <span>{{ moment.label }}</span>
        <strong>{{ moment.value }}</strong>
      </article>
    </div>
  </section>
</template>

<style scoped>
.premium-hero {
  position: relative;
  min-height: calc(100svh - 76px);
  overflow: hidden;
}

.premium-hero-media,
.premium-hero-overlay {
  position: absolute;
  inset: 0;
}

.premium-hero-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: saturate(1.08) contrast(1.04);
}

.premium-hero-overlay {
  background:
    linear-gradient(90deg, rgba(18, 15, 23, 0.92) 0%, rgba(18, 15, 23, 0.78) 36%, rgba(18, 15, 23, 0.22) 100%),
    linear-gradient(180deg, rgba(18, 15, 23, 0.1) 0%, rgba(18, 15, 23, 0.72) 100%);
}

.premium-hero-content {
  position: relative;
  z-index: 2;
  width: min(620px, calc(100% - 3rem));
  padding: 6rem 0 10rem 1.5rem;
}

.premium-kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 800;
  color: #f6c45f;
}

.premium-hero h1 {
  margin-top: 0.9rem;
  max-width: 11ch;
  font-size: clamp(2.8rem, 6vw, 5.6rem);
  line-height: 0.96;
  color: #fff8ef;
}

.premium-intro {
  margin-top: 1.35rem;
  max-width: 58ch;
  color: rgba(255, 248, 239, 0.8);
  font-size: 1.02rem;
  line-height: 1.75;
}

.premium-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1.5rem;
}

.hero-primary {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.2rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #f8d78f, #f5ae2d);
  color: #1a1410;
  font-weight: 800;
}

.hero-secondary {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff8ef;
  background: rgba(255, 255, 255, 0.06);
}

.premium-moment-strip {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 2;
  width: min(420px, calc(100% - 3rem));
  display: grid;
  gap: 0.8rem;
}

.premium-moment-strip article {
  display: grid;
  gap: 0.1rem;
  padding: 1rem 1.1rem;
  background: rgba(255, 248, 239, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.premium-moment-strip span {
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.8rem;
}

.premium-moment-strip strong {
  font-size: 1rem;
  color: #fff8ef;
}

@media (max-width: 980px) {
  .premium-hero-content {
    padding: 5rem 1rem 12rem;
    width: min(640px, calc(100% - 2rem));
  }

  .premium-moment-strip {
    left: 1rem;
    right: 1rem;
    width: auto;
  }
}

@media (max-width: 720px) {
  .premium-hero h1 {
    max-width: 10ch;
  }
}
</style>
