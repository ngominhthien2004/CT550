<script setup>
defineProps({
  slide: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="banner">
    <img :src="slide.image" :alt="slide.title" loading="lazy" />
  </article>
</template>

<style scoped>
.banner {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.banner img {
  width: 100%;
  height: 190px;
  object-fit: cover;
}

@media (max-width: 920px) {
  .banner img {
    height: 150px;
  }
}
</style>
