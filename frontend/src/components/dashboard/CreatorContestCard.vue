<script setup>
defineProps({
  imageUrl: {
    type: String,
    default: 'https://picsum.photos/seed/ct550-contest/560/360',
  },
})
</script>

<template>
  <article class="dash-card contest-card">
    <header class="dash-card-head">Ongoing contests</header>

    <img :src="imageUrl" alt="Contest artwork" class="contest-thumb" loading="lazy" />

    <p class="contest-title">Illustration, Manga & Novel "Magical Party"</p>

    <div class="contest-meta">
      <span class="deadline">Until May 10th</span>
      <span class="works">77 works</span>
    </div>
  </article>
</template>

<style scoped>
.dash-card {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  padding: 0.58rem 0.9rem 0.7rem;
}

.dash-card-head {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
}

.contest-thumb {
  margin: 0.58rem auto 0;
  width: min(260px, 100%);
  display: block;
  border-radius: 0;
  object-fit: cover;
}

.contest-title {
  margin-top: 0.56rem;
  font-size: 1.12rem;
  line-height: 1.25;
  font-weight: 700;
  color: #111827;
}

.contest-meta {
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.52rem;
}

.deadline {
  background: #84cc16;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
  border-radius: 3px;
  padding: 0.16rem 0.52rem;
}

.works {
  font-size: 0.74rem;
  color: #6b7280;
}
</style>
