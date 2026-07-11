<script setup>
const DEFAULT_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  plan: { type: Object, required: true },
  showAccepting: { type: Boolean, default: false },
  showSlots: { type: Boolean, default: false },
  showMeta: { type: Boolean, default: false },
  highlightType: { type: String, default: '' },
})

function formatCurrency(amount, currency = 'USD') {
  return `${currency} ${Number(amount || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return ''
  }
}
</script>

<template>
  <article class="plan-card">
    <div class="plan-card-head">
      <router-link
        :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
        class="plan-creator-link"
      >
        <img :src="plan.creator?.avatar || DEFAULT_AVATAR" :alt="plan.creator?.displayName" class="plan-creator-avatar" />
        <span>{{ plan.creator?.displayName || plan.creator?.username || 'Unknown creator' }}</span>
      </router-link>
      <span class="plan-price">{{ formatCurrency(plan.targetPrice, plan.currency) }}</span>
    </div>
    <h3 class="plan-title">{{ plan.title }}</h3>
    <p class="plan-strengths">{{ plan.strengths }}</p>
    <div class="plan-badges">
      <span class="badge badge-open">Open</span>
      <span v-if="showAccepting" class="badge badge-accepting">Accepting requests</span>
    </div>
    <div class="plan-tags">
      <span v-for="t in plan.acceptedWorkTypes" :key="t" class="plan-tag" :class="{ 'tag-active': t === highlightType }">{{ t }}</span>
      <span class="plan-tag">{{ plan.estimatedDays }} days</span>
      <span v-if="showSlots" class="plan-tag">
        {{ plan.openRequestCount !== undefined ? (plan.maxOpenRequests - plan.openRequestCount) + ' / ' + plan.maxOpenRequests + ' slots' : plan.maxOpenRequests + ' slots' }}
      </span>
    </div>
    <p v-if="showMeta" class="plan-meta">Created {{ formatDate(plan.createdAt) }}</p>
    <p v-else class="plan-rules">{{ plan.rules }}</p>
    <router-link
      :to="{ path: '/account', query: { user: plan.creator?._id, tab: 'requests' } }"
      class="plan-cta"
    >
      View plan
    </router-link>
  </article>
</template>

<style scoped>
.plan-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.plan-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.plan-creator-link {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 700;
  min-width: 0;
}

.plan-creator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.plan-creator-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-price {
  color: var(--accent);
  font-weight: 900;
  font-size: 0.88rem;
  white-space: nowrap;
}

.plan-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}

.plan-strengths {
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.badge {
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-open {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge-accepting {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.plan-tag {
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.22rem 0.5rem;
}

.plan-tag.tag-active {
  background: var(--accent);
  color: #fff;
}

.plan-rules {
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.5;
  margin: 0;
  border-top: 1px solid var(--line);
  padding-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-meta {
  color: var(--muted);
  font-size: 0.75rem;
  margin: 0;
}

.plan-cta {
  display: inline-block;
  margin-top: 0.2rem;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  text-decoration: none;
  text-align: center;
  align-self: flex-start;
}
</style>
