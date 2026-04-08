<script setup>
defineProps({
  imageUrl: {
    type: String,
    default: 'https://picsum.photos/seed/ct550-theme/600/360',
  },
})
</script>

<template>
  <article class="dash-card theme-card">
    <header class="dash-card-head">pixiv Today's Theme <i class="fa-regular fa-circle-question" aria-hidden="true"></i></header>

    <div class="theme-hero" :style="{ backgroundImage: `url('${imageUrl}')` }">
      <p class="theme-title">collarbone</p>
      <p class="theme-sub">#鎖骨</p>
      <p class="theme-cta">Let's draw!</p>
    </div>

    <p class="theme-note">Once you've completed the work, add the tag and post it!</p>
    <button type="button" class="post-btn">Post your work</button>
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

.theme-hero {
  margin-top: 0.55rem;
  height: 146px;
  border-radius: 0;
  background-size: cover;
  background-position: center;
  display: grid;
  align-content: center;
  justify-items: center;
  color: #fff;
  text-shadow: 0 2px 8px rgba(15, 23, 42, 0.55);
}

.theme-title {
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
}

.theme-sub {
  margin-top: 0.2rem;
  font-size: 0.76rem;
}

.theme-cta {
  margin-top: 0.25rem;
  font-size: 1.12rem;
  font-weight: 700;
}

.theme-note {
  margin-top: 0.56rem;
  font-size: 0.7rem;
  text-align: center;
  color: #6b7280;
}

.post-btn {
  margin-top: 0.5rem;
  border: none;
  border-radius: 999px;
  width: 100%;
  height: 30px;
  background: #f3f4f6;
  color: #1f2937;
  font-size: 0.82rem;
  font-weight: 700;
}
</style>
