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

defineEmits(['view-details'])
</script>

<template>
  <article class="dash-card">
    <header class="dash-card-head">
      <span>Total reactions</span>
      <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
    </header>

    <ul class="metric-list">
      <li>
        <span class="metric-label"><i class="fa-regular fa-eye" aria-hidden="true"></i> Views</span>
        <strong>{{ stats.views.toLocaleString() }}</strong>
      </li>
      <li>
        <span class="metric-label"><i class="fa-regular fa-thumbs-up" aria-hidden="true"></i> Likes</span>
        <strong>{{ stats.likes.toLocaleString() }}</strong>
      </li>
      <li>
        <span class="metric-label"><i class="fa-solid fa-heart" aria-hidden="true"></i> Bookmarks</span>
        <strong>{{ stats.bookmarks.toLocaleString() }}</strong>
      </li>
      <li>
        <span class="metric-label"><i class="fa-regular fa-comment" aria-hidden="true"></i> Comments</span>
        <strong>{{ stats.comments.toLocaleString() }}</strong>
      </li>
    </ul>

    <button type="button" class="detail-btn" @click="$emit('view-details')">View details</button>
  </article>
</template>

<style scoped>
.dash-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.dash-card-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
}

.metric-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.metric-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.metric-label {
  color: var(--muted);
  font-size: 0.83rem;
  display: inline-flex;
  gap: 0.34rem;
  align-items: center;
}

.metric-list strong {
  color: var(--text);
  font-size: 1.4rem;
  line-height: 1;
}

.detail-btn {
  margin-top: 0.3rem;
  width: 100%;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.detail-btn:hover {
  background: var(--surface-alt);
}
</style>
