<script setup>
import { computed, onMounted } from 'vue'
import { useFeedStore } from '../stores/feed.store'
import FeedList from '../components/feed/FeedList.vue'
import RankingsPanel from '../components/rankings/RankingsPanel.vue'

const feedStore = useFeedStore()

const spotlight = computed(() => feedStore.feedItems.slice(0, 3))
const discovery = computed(() => feedStore.feedItems.slice(3, 9))

onMounted(async () => {
  await Promise.all([feedStore.fetchFeed({ limit: 12 }), feedStore.fetchRankings('daily')])
})
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Illustration Hub</p>
        <h2>Khong gian sang tac theo phong cach Pixiv, nhung uu tien feed ca nhan truoc.</h2>
        <p class="sub">Tap trung vao theo doi tac gia, bookmark nhanh va rankings theo hanh vi cong dong.</p>
      </div>
      <div class="hero-grid">
        <article v-for="card in spotlight" :key="card._id" class="hero-card">
          <h3>{{ card.title }}</h3>
          <p>{{ card.user?.displayName || card.user?.username }}</p>
        </article>
      </div>
    </section>

    <section class="content-grid">
      <div>
        <header class="section-head">
          <h3>Discovery</h3>
          <router-link to="/feed">View all</router-link>
        </header>
        <FeedList :items="discovery" />
      </div>

      <aside>
        <header class="section-head">
          <h3>Daily Ranking</h3>
          <router-link to="/rankings">Open rankings</router-link>
        </header>
        <RankingsPanel :items="feedStore.rankings.slice(0, 5)" />
      </aside>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 1.25rem;
}

.hero {
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 1.2rem;
  background: linear-gradient(120deg, #fff1d6 0%, #d7f0ff 100%);
  display: grid;
  gap: 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  margin: 0;
  color: #7c2d12;
}

.hero h2 {
  margin: 0.35rem 0 0.45rem;
  font-size: clamp(1.3rem, 2.2vw, 2rem);
  line-height: 1.25;
}

.sub {
  margin: 0;
  color: #334155;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}

.hero-card {
  border-radius: 14px;
  padding: 0.9rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.hero-card h3 {
  margin: 0;
  font-size: 1rem;
}

.hero-card p {
  margin: 0.35rem 0 0;
  color: #475569;
  font-size: 0.9rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 1fr);
  gap: 1rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.section-head h3 {
  margin: 0;
}

.section-head a {
  text-decoration: none;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
