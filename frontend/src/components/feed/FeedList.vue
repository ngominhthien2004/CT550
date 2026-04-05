<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ul class="list-unstyled d-grid gap-3 mb-0">
    <li v-for="item in items" :key="item._id" class="card border-0 shadow-sm overflow-hidden">
      <div class="row g-0">
        <div class="col-4 col-md-3">
          <img v-if="item.image" class="feed-thumb h-100 w-100" :src="item.image" :alt="item.title" loading="lazy" />
          <div v-else class="feed-thumb h-100" />
        </div>
        <div class="col-8 col-md-9">
          <div class="card-body py-3">
            <h3 class="h6 mb-1">
              <router-link class="text-decoration-none" :to="`/artworks/${item._id}`">{{ item.title }}</router-link>
            </h3>
            <p class="mb-0 text-secondary">by {{ item.user?.displayName || item.user?.username }}</p>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.feed-thumb {
  min-height: 92px;
  object-fit: cover;
  background: linear-gradient(135deg, #8bd3ff, #ffd27f);
}
</style>
