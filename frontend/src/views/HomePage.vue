<script setup>
import { discoveryWorks, heroSlides, rankingPreview, trendingTags } from '../assets/mock/home.mock'
</script>

<template>
  <div class="home-page">
    <section class="hero-banner page-block">
      <article class="lead">
        <p class="eyebrow">Pixiv-like Home</p>
        <h2>Discover art nhanh hon voi bo loc don gian va preview ranking ngay tren trang chu.</h2>
        <p class="lead-sub">Du lieu hien tai la mock data de chot UI flow truoc khi bind API that.</p>
        <div class="lead-actions">
          <router-link class="btn primary" to="/feed">Kham pha feed</router-link>
          <router-link class="btn ghost" to="/rankings">Xem ranking</router-link>
        </div>
      </article>

      <div class="showcase-grid">
        <article v-for="slide in heroSlides" :key="slide.id" class="showcase-card">
          <img :src="slide.image" :alt="slide.title" loading="lazy" />
          <div class="overlay">
            <h3>{{ slide.title }}</h3>
            <p>{{ slide.author }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="content-grid">
      <div class="page-block discovery">
        <header class="section-head">
          <h3>Discovery Picks</h3>
          <router-link to="/feed">All works</router-link>
        </header>
        <div class="work-grid">
          <article v-for="work in discoveryWorks" :key="work.id" class="work-card">
            <img :src="work.image" :alt="work.title" loading="lazy" />
            <div class="work-meta">
              <strong>{{ work.title }}</strong>
              <span>{{ work.author }}</span>
              <small>{{ work.likes }} likes</small>
            </div>
          </article>
        </div>
      </div>

      <aside class="side-column">
        <section class="page-block side-card">
          <header class="section-head">
            <h3>Trending Tags</h3>
          </header>
          <div class="tag-list">
            <span v-for="tag in trendingTags" :key="tag">{{ tag }}</span>
          </div>
        </section>

        <section class="page-block side-card">
          <header class="section-head">
            <h3>Daily Ranking</h3>
            <router-link to="/rankings">Open</router-link>
          </header>
          <ol class="mini-ranking">
            <li v-for="(item, index) in rankingPreview" :key="item.id">
              <strong>#{{ index + 1 }} {{ item.title }}</strong>
              <span>{{ item.score }} pts</span>
            </li>
          </ol>
        </section>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 1rem;
}

.hero-banner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 1rem;
  padding: 1rem;
}

.lead {
  display: grid;
  align-content: start;
  gap: 0.8rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 700;
}

.lead h2 {
  font-size: clamp(1.35rem, 2.4vw, 2.1rem);
  line-height: 1.2;
}

.lead-sub {
  color: var(--muted);
}

.lead-actions {
  display: flex;
  gap: 0.6rem;
}

.btn {
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  border: 1px solid transparent;
}

.btn.primary {
  background: #0f172a;
  color: #fff;
}

.btn.ghost {
  border-color: var(--line);
  color: #0f172a;
  background: #fff;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.showcase-card {
  position: relative;
  min-height: 220px;
  border-radius: 14px;
  overflow: hidden;
}

.showcase-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 0.7rem;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.72) 100%);
  color: #fff;
}

.overlay h3 {
  color: #fff;
  font-size: 0.95rem;
}

.overlay p {
  font-size: 0.82rem;
  opacity: 0.95;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 1fr);
  gap: 1rem;
}

.discovery,
.side-card {
  padding: 1rem;
}

.work-grid {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.work-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.work-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.work-meta {
  padding: 0.7rem;
  display: grid;
  gap: 0.2rem;
}

.work-meta span,
.work-meta small {
  color: var(--muted);
}

.side-column {
  display: grid;
  gap: 1rem;
}

.tag-list {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag-list span {
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: #eef4ff;
  color: #1d4ed8;
  font-weight: 600;
  font-size: 0.82rem;
}

.mini-ranking {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

.mini-ranking li {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  background: #fff;
}

.mini-ranking span {
  color: var(--muted);
  font-size: 0.85rem;
}

@media (max-width: 960px) {
  .hero-banner,
  .content-grid,
  .showcase-grid,
  .work-grid {
    grid-template-columns: 1fr;
  }

  .showcase-card {
    min-height: 180px;
  }
}
</style>
