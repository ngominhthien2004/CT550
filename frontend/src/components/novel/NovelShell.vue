<template>
  <section class="novel-top-shell" id="top">
    <slot name="tabs" />
    <slot name="chips" />
    <slot name="banner" />
    <slot name="main" />
    <slot name="bottom" />
  </section>
</template>

<style scoped>
.novel-top-shell {
  display: block;
  max-width: 1024px;
  margin: 0 auto;
}

.novel-top-shell > :deep(*) {
  margin-bottom: 0.85rem;
}

.novel-top-shell > :deep(*:last-child) {
  margin-bottom: 0;
}
</style>
