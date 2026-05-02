<template>
  <header class="premium-topbar">
    <router-link to="/" class="premium-brand">IlluWrl</router-link>
    <nav class="premium-topnav" aria-label="Premium page navigation">
      <a href="#benefits">Benefits</a>
      <a href="#compare">Compare</a>
      <a href="#creator-tools">Creator tools</a>
    </nav>
    <div class="premium-topbar-actions">
      <router-link to="/login" class="topbar-link">Log in</router-link>
      <router-link to="/signup?plan=premium" class="topbar-cta">Start free trial</router-link>
    </div>
  </header>
</template>

<style scoped>
.premium-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1rem 1.5rem;
  background: rgba(18, 15, 23, 0.76);
  backdrop-filter: blur(16px);
}

.premium-brand {
  text-decoration: none;
  font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
  font-size: 1.7rem;
  font-weight: 700;
  color: #ffffff;
}

.premium-topnav {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.premium-topnav a,
.topbar-link {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.92rem;
}

.premium-topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.topbar-cta {
  text-decoration: none;
  color: #1a1410;
  background: linear-gradient(135deg, #f8d78f, #f5ae2d);
  border-radius: 999px;
  padding: 0.72rem 1.1rem;
  font-weight: 800;
}

@media (max-width: 980px) {
  .premium-topbar {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 720px) {
  .premium-topnav {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .premium-topbar-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
