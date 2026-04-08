<script setup>
const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      views: 0,
      likes: 0,
      bookmarks: 0,
      comments: 0,
    }),
  },
})
</script>

<template>
  <article class="dash-card">
    <header class="dash-card-head">Total reactions <i class="fa-regular fa-circle-question" aria-hidden="true"></i></header>

    <ul class="metric-list">
      <li><span><i class="fa-regular fa-eye" aria-hidden="true"></i> Views</span><strong>{{ stats.views }}</strong></li>
      <li><span><i class="fa-regular fa-thumbs-up" aria-hidden="true"></i> Likes</span><strong>{{ stats.likes }}</strong></li>
      <li><span><i class="fa-solid fa-heart" aria-hidden="true"></i> Bookmarks</span><strong>{{ stats.bookmarks }}</strong></li>
      <li><span><i class="fa-regular fa-comment" aria-hidden="true"></i> Comments</span><strong>{{ stats.comments }}</strong></li>
    </ul>

    <button type="button" class="detail-btn">View details <span class="badge">P</span></button>
    <p class="update-note">Latest update: April 6, 2026 2:00</p>
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

.metric-list {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.metric-list li {
  display: grid;
  gap: 0.14rem;
}

.metric-list span {
  color: #6b7280;
  font-size: 0.83rem;
  display: inline-flex;
  gap: 0.34rem;
  align-items: center;
}

.metric-list strong {
  color: #111827;
  font-size: 1.8rem;
  line-height: 1;
}

.detail-btn {
  margin-top: 0.72rem;
  width: 100%;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #1f2937;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge {
  color: #f59e0b;
}

.update-note {
  margin-top: 0.52rem;
  text-align: right;
  color: #9ca3af;
  font-size: 0.66rem;
}
</style>
