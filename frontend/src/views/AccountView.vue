<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import ProfileCoverBanner from '../components/profile/ProfileCoverBanner.vue'
import ProfileSummarySection from '../components/profile/ProfileSummarySection.vue'
import ProfilePrimaryTabs from '../components/profile/ProfilePrimaryTabs.vue'
import ProfileWorksSection from '../components/profile/ProfileWorksSection.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { getArtworks } from '../services/api'

const isNavCollapsed = ref(true)
const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const profileLocation = computed(() => 'Japan (Private)')
const followingCount = computed(() => 1)
const artworks = ref([])
const loadingArtworks = ref(false)
const artworksError = ref('')
const activeType = ref('')

const typeLabelMap = {
  illust: 'Illustration',
  manga: 'Manga',
  novel: 'Novel',
  ugoira: 'Ugoira',
}

const typeTabs = computed(() => {
  const bucket = new Map()

  artworks.value.forEach((item) => {
    const type = String(item.type || '').toLowerCase()
    if (!typeLabelMap[type]) {
      return
    }
    bucket.set(type, (bucket.get(type) || 0) + 1)
  })

  return Object.keys(typeLabelMap)
    .filter((type) => bucket.has(type))
    .map((type) => ({
      value: type,
      label: typeLabelMap[type],
      count: bucket.get(type) || 0,
    }))
})

const visibleArtworks = computed(() => {
  if (!activeType.value) {
    return artworks.value
  }
  return artworks.value.filter((item) => String(item.type || '').toLowerCase() === activeType.value)
})

function normalizeArtwork(item) {
  return {
    ...item,
    image: item.images?.[0] || '',
  }
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function selectType(type) {
  activeType.value = type
}

async function loadUserArtworks() {
  if (!user.value?._id) {
    artworks.value = []
    activeType.value = ''
    return
  }

  loadingArtworks.value = true
  artworksError.value = ''

  try {
    const { data } = await getArtworks({ user: user.value._id, limit: 120 })
    artworks.value = Array.isArray(data) ? data.map(normalizeArtwork) : []

    const firstType = typeTabs.value[0]?.value || ''
    activeType.value = firstType
  } catch (error) {
    artworksError.value = error?.response?.data?.message || 'Failed to load user artworks'
    artworks.value = []
    activeType.value = ''
  } finally {
    loadingArtworks.value = false
  }
}

async function goLogin() {
  await router.push('/login')
}

async function logout() {
  authStore.logout()
  await router.push('/login')
}

onMounted(() => {
  loadUserArtworks()
})

watch(
  () => user.value?._id,
  () => {
    loadUserArtworks()
  },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="user" class="profile-page page-block">
      <ProfileCoverBanner />

      <div class="profile-main">
        <ProfileSummarySection :user="user" :following-count="followingCount" :profile-location="profileLocation" />
        <ProfilePrimaryTabs :home-active="true" />
        <ProfileWorksSection
          :tabs="typeTabs"
          :active-type="activeType"
          :artworks="visibleArtworks"
          :loading="loadingArtworks"
          :error="artworksError"
          @select-type="selectType"
        />
      </div>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Profile</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.profile-page {
  background: #fff;
  min-height: calc(100vh - 112px);
}

.profile-main {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 1.4rem 3.25rem;
  margin-top: -40px;
  position: relative;
  z-index: 2;
}

@media (max-width: 820px) {
  .profile-main {
    padding: 0 0.85rem 2rem;
    margin-top: -28px;
  }
}
</style>
