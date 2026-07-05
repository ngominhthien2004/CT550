<script setup>
defineProps({
  planCount: { type: Number, default: 0 },
  creatorCount: { type: Number, default: 0 },
})
</script>

<template>
  <div class="plans-hero">
    <div class="plans-hero-inner">
      <p class="plans-hero-kicker">Commission Plans</p>
      <h1 class="plans-hero-title">Open plans from creators</h1>
      <p class="plans-hero-desc">
        Browse active commission plans. Find a creator whose style and terms match what you need.
      </p>
      <div class="plans-hero-stats">
        <span class="stat-pill">{{ planCount }} open plan{{ planCount !== 1 ? 's' : '' }}</span>
        <span class="stat-pill">{{ creatorCount }} creator{{ creatorCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-hero {
  border-radius: 16px;
  background: linear-gradient(135deg, #0096fa 0%, #7c3aed 100%);
  padding: 2.2rem 2rem;
  color: #fff;
}

.plans-hero-inner {
  max-width: 600px;
}

.plans-hero-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
  margin: 0 0 0.4rem;
}

.plans-hero-title {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 0.5rem;
  color: inherit;
}

.plans-hero-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 0.9rem;
}

.plans-hero-stats {
  display: flex;
  gap: 0.5rem;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .plans-hero {
    padding: 1.4rem 1.2rem;
  }

  .plans-hero-title {
    font-size: 1.35rem;
  }
}
</style>
