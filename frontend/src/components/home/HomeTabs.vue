<template>
  <div class="tabs">
    <a class="active" href="#">Home</a>
    <a href="#">Illustrations</a>
    <a href="#">Manga</a>
    <a href="#">Novels</a>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 1.9rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0;
}

.tabs a {
  text-decoration: none;
  color: #64748b;
  font-weight: 700;
  padding: 0.55rem 0.1rem 0.7rem;
  font-size: 0.95rem;
}

.tabs .active {
  color: #0f172a;
  border-bottom: 4px solid #1695f0;
}

@media (max-width: 920px) {
  .tabs {
    gap: 1rem;
    overflow-x: auto;
  }

  .tabs a {
    font-size: 0.9rem;
  }
}
</style>
