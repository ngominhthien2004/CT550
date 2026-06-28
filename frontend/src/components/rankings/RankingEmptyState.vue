<script setup>
defineProps({
  type: { type: String, default: 'empty' },
  message: { type: String, default: '' },
  error: { type: String, default: '' },
  periodOptions: { type: Array, default: () => [] },
  activePeriod: { type: String, default: '' },
})

const emit = defineEmits(['retry', 'filter-period'])
</script>

<template>
  <div v-if="type === 'loading'" class="loading-overlay">
    <div class="spinner"></div>
  </div>

  <div v-else-if="type === 'error'" class="empty-state">
    <div class="empty-icon error">
      <i class="fa-solid fa-triangle-exclamation"></i>
    </div>
    <h3 class="empty-title">Something went wrong</h3>
    <p class="empty-desc">{{ error }}</p>
    <button type="button" class="empty-retry-btn" @click="emit('retry')">
      <i class="fa-solid fa-rotate-right"></i> Try Again
    </button>
  </div>

  <div v-else class="empty-state">
    <div class="empty-icon">
      <i class="fa-solid fa-chart-line"></i>
    </div>
    <h3 class="empty-title">No artworks ranked</h3>
    <p class="empty-desc">{{ message }}</p>
    <div class="empty-hints">
      <p class="empty-hint-label">Try:</p>
      <div class="empty-hint-chips">
        <button
          v-for="opt in periodOptions.filter(o => o.value !== activePeriod)"
          :key="opt.value"
          type="button"
          class="hint-chip"
          @click="emit('filter-period', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: conic-gradient(var(--accent) 0deg 270deg, var(--line) 270deg 360deg);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  min-height: 400px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  font-size: 32px;
  color: var(--muted);
}

.empty-icon.error { background: #fef2f2; color: var(--danger); }

.empty-title { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: var(--text); }

.empty-desc {
  margin: 0 0 24px;
  font-size: 15px;
  color: var(--muted);
  max-width: 360px;
  line-height: 1.5;
}

.empty-hints {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-hint-label { margin: 0; font-size: 13px; color: var(--muted); font-weight: 500; }

.empty-hint-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.hint-chip {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--surface-alt); }

.empty-retry-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-retry-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--surface-alt); }
</style>
