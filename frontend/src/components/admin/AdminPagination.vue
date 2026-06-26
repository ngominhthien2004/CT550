<script setup>
defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true },
  total: { type: Number, required: true },
  totalLabel: { type: String, default: 'items' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['go-page'])
</script>

<template>
  <footer class="panel-footer" aria-label="Pagination">
    <span>Page {{ page }} / {{ pages }} · {{ total }} {{ totalLabel }}</span>
    <div class="pager-actions">
      <button type="button" class="btn btn-sm btn-pill" :disabled="page <= 1 || loading" @click="emit('go-page', 1)" title="First page">
        <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
      </button>
      <button type="button" class="btn btn-sm btn-pill" :disabled="page <= 1 || loading" @click="emit('go-page', page - 1)">
        <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
      </button>
      <span class="pager-current">{{ page }} / {{ pages }}</span>
      <button type="button" class="btn btn-sm btn-pill" :disabled="page >= pages || loading" @click="emit('go-page', page + 1)">
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
      </button>
      <button type="button" class="btn btn-sm btn-pill" :disabled="page >= pages || loading" @click="emit('go-page', pages)" title="Last page">
        <i class="fa-solid fa-angles-right" aria-hidden="true"></i>
      </button>
    </div>
  </footer>
</template>

<style scoped>
.panel-footer {
  margin-top: 0.7rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.pager-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-pill {
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn-pill:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.btn-pill:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pager-current {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
  min-width: 4rem;
  text-align: center;
}

@media (max-width: 760px) {
  .panel-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
