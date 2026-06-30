<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  creators: {
    type: Array,
    default: () => [],
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
  isFollowingUser: {
    type: Function,
    required: true,
  },
  isTogglingFollow: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['toggle-follow'])
const router = useRouter()

async function handleFollow(userId) {
  if (!props.isAuthenticated) {
    await router.push({ path: '/login', query: { redirect: '/novels' } })
    return
  }

  emit('toggle-follow', userId)
}
</script>

<template>
  <div class="novel-creators-bottom">
    <section class="novel-creators-card">
      <header class="novel-creators-head">
        <p class="novel-creators-kicker">Recommended creators</p>
        <h3>Writers to follow</h3>
      </header>

      <div v-if="creators.length" class="novel-creator-list">
        <article v-for="creator in creators" :key="creator._id" class="novel-creator-row">
          <router-link :to="`/account?user=${creator._id}`" class="novel-creator-copy">
            <img :src="creator.avatar" :alt="creator.displayName" loading="lazy" />
            <div>
              <strong>{{ creator.displayName }}</strong>
              <span>{{ creator.workCount }} novels</span>
            </div>
          </router-link>

          <button
            type="button"
            class="novel-follow-btn"
            :class="{ 'is-following': isFollowingUser(creator._id) }"
            :disabled="isTogglingFollow(creator._id)"
            @click="handleFollow(creator._id)"
          >
            {{ isFollowingUser(creator._id) ? 'Following' : 'Follow' }}
          </button>
        </article>
      </div>

      <p v-else class="novel-creators-empty">Creator recommendations will appear once novels are available.</p>
    </section>
  </div>
</template>

<style scoped>
.novel-creators-bottom {
  display: block;
}

.novel-creators-card {
  display: grid;
  gap: 0.85rem;
  padding: 1.2rem 0.9rem;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: var(--surface);
}

.novel-creators-head {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.novel-creators-kicker {
  margin: 0;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.novel-creators-head h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.28;
}

.novel-creator-list {
  display: grid;
  gap: 0.65rem;
}

.novel-creator-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.55rem;
  border-radius: 16px;
  background: var(--surface-alt);
  border: 1px solid var(--line);
}

.novel-creator-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--text);
  min-width: 0;
}

.novel-creator-copy img {
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 999px;
  object-fit: cover;
  flex: 0 0 auto;
}

.novel-creator-copy div {
  display: grid;
  gap: 0.08rem;
  min-width: 0;
}

.novel-creator-copy strong,
.novel-creator-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-creator-copy strong {
  font-size: 0.84rem;
  line-height: 1.25;
}

.novel-creator-copy span {
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 700;
}

.novel-follow-btn {
  flex: 0 0 auto;
  border: 1px solid rgba(22, 149, 240, 0.18);
  background: rgba(22, 149, 240, 0.08);
  color: var(--brand);
  border-radius: 999px;
  padding: 0.45rem 0.74rem;
  font-size: 0.76rem;
  font-weight: 800;
}

.novel-follow-btn.is-following {
  color: var(--muted);
  border-color: var(--line);
  background: var(--surface);
}

.novel-follow-btn:disabled {
  opacity: 0.7;
}

.novel-creators-empty {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
  font-size: 0.84rem;
}
</style>
