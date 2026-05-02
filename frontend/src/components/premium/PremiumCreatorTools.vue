<template>
  <section id="creator-tools" class="premium-creator">
    <div class="creator-visual">
      <div class="creator-visual-panel">
        <p class="panel-kicker">Premium creator toolkit</p>
        <div class="panel-chart">
          <span class="bar tall"></span>
          <span class="bar medium"></span>
          <span class="bar short"></span>
          <span class="bar tall accent"></span>
          <span class="bar medium accent"></span>
        </div>
        <div class="panel-grid">
          <span>Audience rhythm</span>
          <span>Search lift</span>
          <span>Bookmark velocity</span>
          <span>Chapter depth</span>
        </div>
      </div>
    </div>
    <div class="creator-copy">
      <p class="section-kicker">Made for active creators</p>
      <h2>Use premium to spot traction earlier and shape your next release with more confidence.</h2>
      <p>
        When you publish regularly, small signals matter. Premium helps you notice where discovery comes from, which formats sustain attention, and what deserves a follow-up chapter, post, or alternate version.
      </p>
      <router-link to="/signup?plan=premium" class="creator-link">Upgrade your creator workflow</router-link>
    </div>
  </section>
</template>

<style scoped>
.premium-creator {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
  gap: 2rem;
  max-width: 1120px;
  margin: 0 auto;
  padding: 5rem 1.5rem;
  align-items: center;
  color: #1d1a20;
}

.creator-visual {
  min-height: 460px;
  background:
    radial-gradient(circle at top left, rgba(245, 174, 45, 0.28), transparent 28%),
    linear-gradient(145deg, #201928 0%, #2d2031 55%, #16121a 100%);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.creator-visual-panel {
  width: min(480px, calc(100% - 2rem));
  padding: 1.4rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff8ef;
  backdrop-filter: blur(14px);
}

.panel-kicker,
.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 800;
  color: #f6c45f;
}

.panel-chart {
  height: 210px;
  display: flex;
  align-items: end;
  gap: 0.8rem;
  margin-top: 1.2rem;
}

.bar {
  flex: 1;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(180deg, rgba(128, 190, 255, 0.95), rgba(73, 110, 255, 0.48));
}

.bar.accent {
  background: linear-gradient(180deg, rgba(248, 215, 143, 0.96), rgba(245, 174, 45, 0.42));
}

.bar.tall {
  height: 100%;
}

.bar.medium {
  height: 72%;
}

.bar.short {
  height: 45%;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
  color: rgba(255, 248, 239, 0.72);
  font-size: 0.88rem;
}

.creator-copy h2 {
  margin-top: 0.8rem;
  max-width: 16ch;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.02;
  color: #1f1721;
}

.creator-copy p:last-of-type {
  margin-top: 1rem;
  max-width: 56ch;
  color: #5f5666;
  line-height: 1.8;
}

.creator-link {
  margin-top: 1.5rem;
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

@media (max-width: 980px) {
  .premium-creator {
    grid-template-columns: 1fr;
  }
}
</style>
