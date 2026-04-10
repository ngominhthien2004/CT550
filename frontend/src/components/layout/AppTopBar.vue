<script setup>
import InternalAppTopBar from './AppTopBar/AppTopBar.vue'

const props = defineProps({
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search by title, tag, or artist',
  },
})

const emit = defineEmits(['toggle-sidebar'])

function handleToggleSidebar() {
  emit('toggle-sidebar')
}
</script>

<template>
  <InternalAppTopBar
    :site-name="props.siteName"
    :search-placeholder="props.searchPlaceholder"
    @toggle-sidebar="handleToggleSidebar"
  />
</template>
