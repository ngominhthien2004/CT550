<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ol class="list-group list-group-numbered">
    <li
      v-for="(item, index) in items"
      :key="item._id"
      class="list-group-item d-flex align-items-center justify-content-between py-3"
    >
      <div class="d-flex align-items-center gap-3">
        <span class="badge text-bg-warning-subtle text-dark border">#{{ index + 1 }}</span>
        <strong>{{ item.title }}</strong>
      </div>
      <span class="text-secondary small">{{ item.likeCount }} likes</span>
    </li>
  </ol>
</template>

<style scoped>
:deep(.list-group-numbered > .list-group-item::before) {
  display: none;
}
</style>
