<script setup>
defineProps({
  userFilterType: { type: String, required: true },
  userSortMode: { type: String, required: true },
})

const emit = defineEmits(['update:userFilterType', 'update:userSortMode', 'reload'])
</script>

<template>
  <div class="user-search-filter-row">
    <div class="user-filter-tabs" aria-label="User search filters">
      <button
        type="button"
        class="user-filter-chip"
        :class="{ 'is-active': userFilterType === 'creator' }"
        @click="emit('update:userFilterType', 'creator'); emit('reload')"
      >Creators</button>
      <button
        type="button"
        class="user-filter-link"
        :class="{ 'is-active': userFilterType === 'all' }"
        @click="emit('update:userFilterType', 'all'); emit('reload')"
      >All accounts</button>
    </div>
    <label class="order-select">
      <select :value="userSortMode" aria-label="Sort users" @change="emit('update:userSortMode', $event.target.value); emit('reload')">
        <option value="newest">Newest</option>
        <option value="popular">Popular</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.user-search-filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-filter-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-filter-chip,
.user-filter-link {
  border: none;
  background: transparent;
  padding: 0.4rem 0.8rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.15s;
}

.user-filter-chip.is-active,
.user-filter-link.is-active {
  background: #111827;
  color: #fff;
}

.order-select select {
  padding: 0.4rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
  color: #374151;
}
</style>
