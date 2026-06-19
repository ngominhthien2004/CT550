<script setup>
defineProps({
  fontSize: { type: String, required: true },
  isDarkMode: { type: Boolean, default: false },
  canDecrease: { type: Boolean, default: true },
  canIncrease: { type: Boolean, default: true },
})

const emit = defineEmits(['decrease-font', 'increase-font', 'toggle-dark'])
</script>

<template>
  <div class="novel-controls-bar">
    <div class="controls-group">
      <button type="button"
        class="ctrl-btn font-btn"
        :class="{ disabled: !canDecrease }"
        :disabled="!canDecrease"
        title="Decrease font size"
        @click="emit('decrease-font')"
      >
        <span class="ctrl-label">A</span><span class="ctrl-modifier">–</span>
      </button>
      <span class="font-size-indicator">{{ fontSize }}</span>
      <button type="button"
        class="ctrl-btn font-btn"
        :class="{ disabled: !canIncrease }"
        :disabled="!canIncrease"
        title="Increase font size"
        @click="emit('increase-font')"
      >
        <span class="ctrl-label">A</span><span class="ctrl-modifier">+</span>
      </button>
    </div>

    <div class="controls-group">
      <button type="button" class="ctrl-btn theme-btn" title="Toggle dark mode" @click="emit('toggle-dark')">
        <span v-if="isDarkMode" class="ctrl-icon" aria-hidden="true">☀️</span>
        <span v-else class="ctrl-icon" aria-hidden="true">🌙</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.novel-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--novel-border);
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--novel-border);
  border-radius: 6px;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  line-height: 1;
  user-select: none;
}

.ctrl-btn:hover:not(.disabled) {
  background: var(--novel-accent);
  color: #ffffff;
  border-color: var(--novel-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 150, 250, 0.25);
}

.ctrl-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-btn .ctrl-label {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: 1rem;
}

.font-btn .ctrl-modifier {
  font-size: 0.8rem;
  margin-left: 1px;
}

.font-size-indicator {
  font-size: 0.75rem;
  font-family: ui-monospace, 'SF Mono', monospace;
  color: var(--novel-muted);
  min-width: 3.5rem;
  text-align: center;
}

.theme-btn {
  font-size: 1rem;
  padding: 0 0.6rem;
}
</style>
