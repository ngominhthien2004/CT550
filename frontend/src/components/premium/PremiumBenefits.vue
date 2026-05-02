<script setup>
defineProps({
  features: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section id="benefits" class="premium-benefits">
    <header class="section-lead">
      <p class="section-kicker">Why upgrade</p>
      <h2>The premium workflow is tuned for people who browse often and post intentionally.</h2>
    </header>

    <div class="benefit-list">
      <article v-for="feature in features" :key="feature.title" class="benefit-row">
        <p class="benefit-eyebrow">{{ feature.eyebrow }}</p>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.copy }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.premium-benefits {
  padding: 5rem 1.5rem;
  color: #1d1a20;
}

.section-lead {
  max-width: 1120px;
  margin: 0 auto;
}

.section-kicker,
.benefit-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 800;
}

.section-kicker {
  color: #f6c45f;
}

.section-lead h2 {
  margin-top: 0.8rem;
  max-width: 16ch;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.02;
  color: #1f1721;
}

.benefit-list {
  max-width: 1120px;
  margin: 2rem auto 0;
  border-top: 1px solid rgba(31, 23, 33, 0.14);
}

.benefit-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 1.3rem;
  padding: 1.35rem 0;
  border-bottom: 1px solid rgba(31, 23, 33, 0.12);
  align-items: start;
}

.benefit-row h3 {
  font-size: 1.28rem;
  line-height: 1.2;
  color: #1f1721;
}

.benefit-row p:last-child {
  color: #60566a;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .benefit-row {
    grid-template-columns: 1fr;
  }
}
</style>
