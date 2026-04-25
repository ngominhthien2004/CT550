<script setup>
import { computed } from 'vue'
import ArtworkCard from '../artwork/ArtworkCard.vue'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  activeType: {
    type: String,
    default: '',
  },
  likes: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-type'])

const totalCount = computed(() => {
  return props.tabs.reduce((sum, tab) => sum + tab.count, 0)
})
</script>

<template>
  <section class="likes-panel" aria-label="Favorites section">
    <div class="like-type-tabs" role="tablist" aria-label="Favorite type tabs">
      <button
        type="button"
        class="like-type-tab"
        :class="{ active: activeType === '' }"
        role="tab"
        :aria-selected="activeType === ''"
        @click="emit('select-type', '')"
      >
        All
        <span>{{ totalCount }}</span>
      </button>
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="like-type-tab"
        :class="{ active: tab.value === activeType }"
        role="tab"
        :aria-selected="tab.value === activeType"
        @click="emit('select-type', tab.value)"
      >
        {{ tab.label }}
        <span>{{ tab.count }}</span>
      </button>
    </div>

    <p v-if="loading" class="bm-note">Loading favorites...</p>
    <p v-else-if="error" class="bm-note error">{{ error }}</p>

    <div v-else-if="likes.length" class="like-grid">
      <ArtworkCard v-for="like in likes" :key="like._id" :item="like.artwork" />
    </div>

    <div v-else class="like-empty">
      <i class="fa-solid fa-heart" aria-hidden="true"></i>
      <p>No favorites found.</p>
    </div>
  </section>
</template>

<style scoped>
.likes-panel {
  padding-top: 2rem;
  display: grid;
  gap: 1rem;
}

.like-type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.like-type-tab {
  border: 1px solid #dbe4ef;
  border-radius: 999px;
  background: #fff;
  color: #4b5563;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.42rem 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.like-type-tab.active {
  border-color: #93c5fd;
  color: #0369a1;
  background: #e0f2fe;
}

.bm-note {
  margin: 0;
  color: #6b7280;
}

.bm-note.error {
  color: #dc2626;
}

.like-grid {
  display: grid;
  gap: 1rem 0.9rem;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.like-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: #b4bac5;
}

.like-empty i {
  font-size: 1.4rem;
}

.like-empty p {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 1240px) {
  .like-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .like-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
