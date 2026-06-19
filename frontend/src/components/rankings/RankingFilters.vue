<script setup>
defineProps({
  typeOptions: { type: Array, required: true },
  periodOptions: { type: Array, required: true },
  activeType: { type: String, required: true },
  activePeriod: { type: String, required: true },
  periodLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:type', 'update:period'])
</script>

<template>
  <nav class="type-tabs">
    <button
      v-for="opt in typeOptions"
      :key="opt.value"
      type="button"
      class="type-tab-btn"
      :class="{ active: activeType === opt.value }"
      @click="emit('update:type', opt.value)"
    >
      {{ opt.label }}
    </button>
  </nav>

  <div class="period-bar">
    <div class="period-tabs">
      <button
        v-for="opt in periodOptions"
        :key="opt.value"
        type="button"
        class="period-tab-btn"
        :class="{ active: activePeriod === opt.value }"
        @click="emit('update:period', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
    <div class="date-indicator">{{ periodLabel }}</div>
  </div>
</template>

<style scoped>
.type-tabs {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  border-bottom: 1px solid var(--line);
}

.type-tab-btn {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.type-tab-btn:hover { color: var(--accent); }
.type-tab-btn.active { color: var(--accent); }

.type-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
}

.period-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 8px 0;
}

.period-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-alt);
  padding: 4px;
  border-radius: 8px;
}

.period-tab-btn {
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-tab-btn:hover { color: var(--text); }

.period-tab-btn.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.date-indicator {
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}
</style>
