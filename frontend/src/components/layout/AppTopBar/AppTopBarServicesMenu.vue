<script setup>
defineProps({
  siteLabel: {
    type: String,
    required: true,
  },
  serviceLinks: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <details class="services-menu">
    <summary class="icon-round app-grid-btn" aria-label="Related services" title="Related services">
      <span class="app-grid-icon" aria-hidden="true">
        <span v-for="dot in 9" :key="dot" class="app-grid-dot"></span>
      </span>
    </summary>
    <div class="services-panel" role="menu" aria-label="Related services menu">
      <p class="services-title">{{ siteLabel }} services</p>
      <router-link
        v-for="item in serviceLinks"
        :key="item.key"
        :to="item.to"
        class="services-item"
        role="menuitem"
      >
        <img :src="item.thumbnail" :alt="item.label" class="services-thumb" loading="lazy" />
        <span class="services-copy">
          <strong>{{ siteLabel }} {{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </span>
      </router-link>
    </div>
  </details>
</template>

<style scoped>
.services-menu {
  position: relative;
}

.icon-round {
  text-decoration: none;
  color: inherit;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.app-grid-btn {
  padding: 0;
  list-style: none;
}

.app-grid-btn::-webkit-details-marker {
  display: none;
}

.app-grid-icon {
  display: grid;
  grid-template-columns: repeat(3, 4px);
  gap: 2px;
}

.app-grid-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #6b7280;
}

.services-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  width: 292px;
  max-height: min(76vh, 500px);
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
  z-index: 22;
  padding: 0.45rem;
  display: grid;
  gap: 0.3rem;
}

.services-title {
  margin: 0;
  padding: 0.35rem 0.42rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
}

.services-item {
  text-decoration: none;
  color: #1f2937;
  border-radius: 10px;
  padding: 0.46rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.services-item:hover,
.services-item:focus-visible {
  background: #f1f5f9;
}

.services-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.services-copy {
  display: grid;
  min-width: 0;
}

.services-copy strong {
  font-size: 0.86rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
}

.services-copy small {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.25;
}
</style>
