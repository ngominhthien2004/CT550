<template>
  <details class="post-menu">
    <summary class="post-btn" aria-label="Create new post" title="Create new post">
      Post
      <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
    </summary>
    <div class="post-menu-list" role="menu" aria-label="Post type menu">
      <router-link to="/upload/illust" class="post-menu-item" role="menuitem" aria-label="Post illustration">Illustration</router-link>
      <router-link to="/upload/manga" class="post-menu-item" role="menuitem" aria-label="Post manga">Manga</router-link>
      <router-link to="/upload/ugoira" class="post-menu-item" role="menuitem" aria-label="Post ugoira animation">Ugoira</router-link>
      <router-link to="/upload/novel" class="post-menu-item" role="menuitem" aria-label="Post novel">Novel</router-link>
    </div>
  </details>
</template>

<style scoped>
.post-btn {
  list-style: none;
  border: 1px solid #d5dbe3;
  border-radius: 999px;
  padding: 0.42rem 0.72rem;
  background: #eef2f7;
  color: #1f2937;
  font-weight: 700;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  cursor: pointer;
}

.post-btn::-webkit-details-marker {
  display: none;
}

.post-menu {
  position: relative;
}

.post-menu-list {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 0.35rem;
  border: 1px solid #dce3ec;
  border-radius: 0.72rem;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 20;
}

.post-menu-item {
  text-decoration: none;
  color: #1f2937;
  padding: 0.45rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.post-menu-item:hover,
.post-menu-item:focus-visible {
  background: #f1f5f9;
}
</style>
