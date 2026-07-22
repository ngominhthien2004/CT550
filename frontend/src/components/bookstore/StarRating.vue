<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  size: { type: String, default: 'medium' }, // 'small' | 'medium' | 'large'
  showValue: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
})

const { t } = useI18n()

const sizeMap = {
  small: '0.9rem',
  medium: '1.2rem',
  large: '1.5rem',
}

const fontSize = computed(() => sizeMap[props.size] || sizeMap.medium)

const stars = computed(() => {
  // Return array of N objects: { fill: 0..1, index: 1..N }
  return Array.from({ length: props.max }, (_, i) => {
    const starValue = props.value - i
    return {
      index: i + 1,
      fill: Math.max(0, Math.min(1, starValue)),
    }
  })
})

const displayValue = computed(() => {
  // Round to 1 decimal place for display
  return Math.round(props.value * 10) / 10
})

const autoLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  // Localized "5.0 out of 5" / "5.0 trên 5" / "5.0/5"
  return t('bookstore.ratedOutOf', { rating: displayValue.value, max: props.max })
})
</script>

<template>
  <span
    class="star-rating"
    :class="['star-rating--' + size]"
    :aria-label="autoLabel"
    role="img"
  >
    <span class="star-rating__stars" aria-hidden="true">
      <span
        v-for="star in stars"
        :key="star.index"
        class="star-rating__star"
        :style="{
          fontSize,
          background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${star.fill * 100}%, var(--line) ${star.fill * 100}%, var(--line) 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }"
      >★</span>
    </span>
    <span v-if="showValue" class="star-rating__value" aria-hidden="true">{{ displayValue }}</span>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.star-rating__stars {
  display: inline-flex;
  gap: 0.1rem;
}

.star-rating__star {
  line-height: 1;
  display: inline-block;
  /* The text is colored via background-clip; fall back to muted color for no-JS / very old browsers */
  color: var(--line);
}

.star-rating__value {
  font-weight: 700;
  color: var(--text);
}
</style>
