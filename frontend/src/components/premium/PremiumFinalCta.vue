<template>
  <section class="premium-final-cta">
    <p class="section-kicker">Start now</p>
    <h2>Try IlluWrl Premium and make every browse session more intentional.</h2>
    <p>One subscription for better discovery, calmer reading, and stronger creator feedback loops.</p>
    <div class="premium-final-actions">
      <router-link to="/signup?plan=premium" class="final-primary">Start free trial</router-link>
      <router-link to="/" class="final-secondary">Back to Home</router-link>
    </div>
  </section>
</template>

<style scoped>
.premium-final-cta {
  padding: 5rem 1.5rem 6rem;
  text-align: center;
  color: #1d1a20;
  max-width: 1120px;
  margin: 0 auto;
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 800;
  color: #f6c45f;
}

.premium-final-cta h2 {
  margin-top: 0.8rem;
  max-width: 13ch;
  margin-left: auto;
  margin-right: auto;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.02;
  color: #1f1721;
}

.premium-final-cta p:last-of-type {
  margin-top: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 56ch;
  color: #5f5666;
  line-height: 1.8;
}

.premium-final-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.9rem;
  margin-top: 1.5rem;
}

.final-primary,
.final-secondary {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.2rem;
  border-radius: 999px;
}

.final-primary {
  background: linear-gradient(135deg, #f8d78f, #f5ae2d);
  color: #1a1410;
  font-weight: 800;
}

.final-secondary {
  border: 1px solid rgba(31, 23, 33, 0.14);
  color: #1f1721;
  background: rgba(255, 255, 255, 0.7);
}

@media (max-width: 720px) {
  .premium-final-cta {
    text-align: left;
  }

  .premium-final-cta h2,
  .premium-final-cta p:last-of-type {
    margin-left: 0;
    margin-right: 0;
  }

  .premium-final-actions {
    justify-content: flex-start;
  }
}
</style>
