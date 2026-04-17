<script setup>
defineProps({
  works: { type: Array, default: () => [] },
})
</script>

<template>
  <section v-if="works.length" class="strip-shell">
    <div class="strip">
      <router-link v-for="item in works" :key="item._id" :to="`/artworks/${item._id}`" class="strip-item" :title="item.title">
        <img v-if="item.images?.[0]" :src="item.images[0]" :alt="item.title" loading="lazy" />
        <span class="heart" aria-hidden="true"><i class="fa-regular fa-heart"></i></span>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.strip {
  display: flex;
  gap: 0.65rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.strip-item {
  position: relative;
  flex: 0 0 auto;
  width: 84px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.strip-item img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
}

.heart {
  position: absolute;
  right: 0.45rem;
  bottom: 0.4rem;
  width: 1.9rem;
  height: 1.9rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #0f172a;
}
</style>
