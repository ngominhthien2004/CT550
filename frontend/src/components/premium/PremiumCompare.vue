<script setup>
defineProps({
  perks: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section id="compare" class="premium-compare">
    <div class="compare-copy">
      <p class="section-kicker">Compare plans</p>
      <h2>Everything in the standard IlluWrl experience, plus the tools people use when they want better signal.</h2>
      <ul class="perk-list">
        <li v-for="perk in perks" :key="perk">{{ perk }}</li>
      </ul>
    </div>

    <div class="compare-table" aria-label="Free and premium comparison">
      <div class="compare-head">
        <span>Included</span>
        <strong>Free</strong>
        <strong>Premium</strong>
      </div>
      <div v-for="row in rows" :key="row.label" class="compare-row">
        <span>{{ row.label }}</span>
        <span>{{ row.free }}</span>
        <span class="premium-cell">{{ row.premium }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.premium-compare {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 2rem;
  max-width: 1120px;
  margin: 0 auto;
  padding: 5rem 1.5rem;
  color: #1d1a20;
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 800;
  color: #f6c45f;
}

.compare-copy h2 {
  margin-top: 0.8rem;
  max-width: 16ch;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.02;
  color: #1f1721;
}

.perk-list {
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.7rem;
  color: #4f4455;
}

.perk-list li::before {
  content: '+';
  display: inline-block;
  width: 1.4rem;
  color: #c77c00;
  font-weight: 800;
}

.compare-table {
  border-top: 1px solid rgba(31, 23, 33, 0.18);
}

.compare-head,
.compare-row {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.75fr) minmax(0, 0.95fr);
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(31, 23, 33, 0.12);
}

.compare-head {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7b6d81;
}

.compare-row span:first-child {
  font-weight: 700;
  color: #241d28;
}

.compare-row span:nth-child(2) {
  color: #6c6170;
}

.premium-cell {
  color: #9a5d00;
  font-weight: 700;
}

@media (max-width: 980px) {
  .premium-compare {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .compare-head,
  .compare-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .compare-head {
    display: none;
  }

  .compare-row {
    padding: 1rem 0;
  }
}
</style>
