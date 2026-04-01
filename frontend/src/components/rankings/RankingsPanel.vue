<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ol class="ranking-list">
    <li v-for="(item, index) in items" :key="item._id" class="ranking-item">
      <div class="rank">#{{ index + 1 }}</div>
      <div class="content">
        <strong>{{ item.title }}</strong>
        <span>{{ item.likeCount }} likes</span>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.ranking-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.65rem;
}

.ranking-item {
  display: grid;
  grid-template-columns: 62px 1fr;
  align-items: center;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.rank {
  text-align: center;
  font-weight: 700;
  color: #0f172a;
  background: #fef3c7;
  padding: 0.9rem 0;
}

.content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
}

.content span {
  color: #4b5563;
  font-size: 0.9rem;
}
</style>
