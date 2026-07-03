<template>
  <details class="post-menu">
    <summary class="action-pill action-pill--post" aria-label="Create new post" title="Create new post">
      Post
      <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
    </summary>
    <div class="dd-panel" role="menu" aria-label="Post type menu">
      <router-link to="/upload/illust" class="dd-item" role="menuitem" aria-label="Post illustration">Illustration</router-link>
      <router-link to="/upload/manga" class="dd-item" role="menuitem" aria-label="Post manga">Manga</router-link>
      <router-link to="/upload/gif" class="dd-item" role="menuitem" aria-label="Post GIF animation">GIF</router-link>
      <router-link to="/upload/novel" class="dd-item" role="menuitem" aria-label="Post novel">Novel</router-link>
    </div>
  </details>
</template>

<style scoped src="../../../assets/styles/dropdown.css"></style>

<style scoped>
.post-menu {
  position: relative;
}

/* Post menu item sizing override */
.dd-panel .dd-item {
  padding: 0.45rem 0.6rem;
  font-size: 0.9rem;
  border-radius: 0.5rem;
}
</style>
