<script setup>
import {
  discoveryWorks,
  heroSlides,
  navItems,
  rankingPreview,
  topTags,
  trendingTags,
} from '../assets/mock/home.mock'
</script>

<template>
  <div class="home-layout">
    <aside class="left-nav page-block">
      <div class="brand">IlluWrl</div>
      <nav>
        <a v-for="item in navItems" :key="item.id" href="#">{{ item.label }}</a>
      </nav>
    </aside>

    <section class="home-main page-block">
      <header class="search-row">
        <div class="search-box">Tìm kiếm minh họa, manga, tiểu thuyết</div>
        <button class="pill light">Minh họa và Manga</button>
        <button class="pill">Đăng tác phẩm</button>
      </header>

      <div class="tag-strip">
        <span v-for="tag in topTags" :key="tag">{{ tag }}</span>
      </div>

      <div class="tabs">
        <a class="active" href="#">Dành cho bạn</a>
        <a href="#">Minh họa</a>
        <a href="#">Manga</a>
        <a href="#">Tiểu thuyết</a>
      </div>

      <article class="banner">
        <img :src="heroSlides[0].image" :alt="heroSlides[0].title" loading="lazy" />
        <div class="banner-overlay">
          <h2>{{ heroSlides[0].title }}</h2>
          <p>Tác giả: {{ heroSlides[0].author }}</p>
        </div>
      </article>

      <section class="latest-section">
        <header class="section-head">
          <h3>Tác phẩm mới dành cho bạn</h3>
          <router-link to="/feed">Xem tất cả</router-link>
        </header>

        <div class="work-grid">
          <article v-for="work in discoveryWorks" :key="work.id" class="work-card">
            <img :src="work.image" :alt="work.title" loading="lazy" />
            <div class="work-meta">
              <strong>{{ work.title }}</strong>
              <span>{{ work.author }}</span>
              <small>{{ work.likes }} lượt thích</small>
            </div>
          </article>
        </div>
      </section>
    </section>

    <aside class="right-rail">
      <section class="page-block side-card">
        <h3>Xu hướng thẻ</h3>
        <div class="tag-list">
          <span v-for="tag in trendingTags" :key="tag">{{ tag }}</span>
        </div>
      </section>

      <section class="page-block side-card">
        <header class="section-head">
          <h3>Bảng xếp hạng ngày</h3>
          <router-link to="/rankings">Mở</router-link>
        </header>
        <ol class="mini-ranking">
          <li v-for="(item, index) in rankingPreview" :key="item.id">
            <strong>#{{ index + 1 }} {{ item.title }}</strong>
            <span>{{ item.score }} điểm</span>
          </li>
        </ol>
      </section>
    </aside>
  </div>
</template>

<style scoped>

.home-layout {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr) 280px;
  gap: 0.8rem;
}

.left-nav {
  padding: 1rem 0.8rem;
  position: sticky;
  top: 0.8rem;
  height: fit-content;
}

.brand {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4ed8;
  padding: 0.2rem 0.5rem 0.8rem;
  letter-spacing: -0.02em;
}

.left-nav nav {
  display: grid;
  gap: 0.2rem;
}

.left-nav a {
  text-decoration: none;
  color: #334155;
  padding: 0.6rem 0.65rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.92rem;
}

.left-nav a:hover {
  background: #edf5ff;
}

.home-main {
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.search-row {
  display: flex;
  gap: 0.6rem;
}

.search-box {
  flex: 1.4;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.65rem 0.8rem;
  color: #64748b;
  background: #fff;
}

.pill {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  background: #111827;
  color: #fff;
  font-weight: 700;
}

.pill.light {
  background: #eef2f7;
  color: #1f2937;
}

.tag-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.tag-strip span {
  white-space: nowrap;
  padding: 0.42rem 0.7rem;
  border-radius: 10px;
  color: #fff;
  font-size: 0.83rem;
  font-weight: 700;
}

.tag-strip span:nth-child(6n + 1) {
  background: #79a65a;
}

.tag-strip span:nth-child(6n + 2) {
  background: #b07ba4;
}

.tag-strip span:nth-child(6n + 3) {
  background: #5f88cc;
}

.tag-strip span:nth-child(6n + 4) {
  background: #d87a6e;
}

.tag-strip span:nth-child(6n + 5) {
  background: #7b78cf;
}

.tag-strip span:nth-child(6n + 6) {
  background: #5f9db0;
}

.tabs {
  display: flex;
  gap: 1.1rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.55rem;
}

.tabs a {
  text-decoration: none;
  color: #64748b;
  font-weight: 700;
  padding-bottom: 0.45rem;
}

.tabs .active {
  color: #0f172a;
  border-bottom: 3px solid #1695f0;
}

.banner {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}

.banner img {
  width: 100%;
  height: 320px;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 1rem;
  color: #fff;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.7));
}

.banner-overlay h2 {
  color: #fff;
  margin-bottom: 0.35rem;
  font-size: 1.25rem;
}

.latest-section {
  display: grid;
  gap: 0.75rem;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  height: 160px;
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

.right-rail {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.side-card {
  padding: 1rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag-list span {
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-weight: 600;
  font-size: 0.82rem;
}

.mini-ranking {
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

.mini-ranking li {
  display: grid;
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

@media (max-width: 1200px) {
  .home-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .right-rail {
    grid-column: 2;
    grid-template-columns: 1fr 1fr;
  }

  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .left-nav {
    position: static;
  }

  .search-row {
    flex-direction: column;
  }

  .right-rail,
  .work-grid {
    grid-template-columns: 1fr;
  }

  .banner img {
    height: 220px;
  }
}
</style>
