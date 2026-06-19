<script setup>
defineProps({
  type: { type: String, default: 'card' }, // 'card', 'text', 'avatar', 'banner'
  count: { type: Number, default: 1 },
})
</script>

<template>
  <div v-if="type === 'card'" class="skeleton-grid">
    <div v-for="i in count" :key="'sk-card-' + i" class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-line skeleton-line--short"></div>
      <div class="skeleton-line skeleton-line--medium"></div>
    </div>
  </div>
  <div v-else-if="type === 'text'" class="skeleton-text-block">
    <div v-for="i in count" :key="'sk-line-' + i" class="skeleton-line" :class="'skeleton-line--w' + ((i % 4 + 2) * 20)"></div>
  </div>
  <div v-else-if="type === 'avatar'" class="skeleton-avatar-wrap">
    <div class="skeleton-avatar"></div>
  </div>
  <div v-else-if="type === 'banner'" class="skeleton-banner"></div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  gap: 1rem 0.9rem;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.skeleton-card {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #f0f0f0;
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin: 8px 10px;
}

.skeleton-text-block {
  padding: 1rem 0;
}

.skeleton-line--short { width: 60%; }
.skeleton-line--medium { width: 80%; }
.skeleton-line--w40 { width: 40%; }
.skeleton-line--w60 { width: 60%; }
.skeleton-line--w80 { width: 80%; }
.skeleton-line--w100 { width: 100%; }

.skeleton-avatar-wrap {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.skeleton-avatar {
  width: 94px;
  height: 94px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-banner {
  height: 300px;
  border-radius: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1240px) { .skeleton-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 920px) { .skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
