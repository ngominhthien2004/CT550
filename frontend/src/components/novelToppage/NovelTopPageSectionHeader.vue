<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  to: {
    type: [String, Object],
    default: '',
  },
  linkLabel: {
    type: String,
    default: 'Show all',
  },
})
</script>

<template>
  <header class="novel-section-header">
    <div>
      <h2>{{ title }}</h2>
      <p v-if="subtitle" class="novel-section-subtitle">{{ subtitle }}</p>
    </div>

    <router-link v-if="to" :to="to" class="novel-section-link">{{ linkLabel }}</router-link>
  </header>
</template>

<style scoped>
.novel-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.novel-section-header h2 {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.2;
}

.novel-section-subtitle {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.84rem;
}

.novel-section-link {
  text-decoration: none;
  color: var(--accent);
  font-weight: 700;
  font-size: 0.86rem;
  white-space: nowrap;
}

.novel-section-link:hover {
  text-decoration: underline;
}
</style>
