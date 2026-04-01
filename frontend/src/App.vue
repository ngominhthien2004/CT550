<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>CT550 Social Phase 2</h1>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/feed">Feed</router-link>
        <router-link to="/bookmarks">Bookmarks</router-link>
        <router-link to="/rankings">Rankings</router-link>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.topbar h1 {
  margin: 0;
  font-size: 1.125rem;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

nav a.router-link-active {
  color: #111827;
}

main {
  padding: 1.5rem;
}
</style>
