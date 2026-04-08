<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { useMessageStore } from '../stores/message.store'

const isNavCollapsed = ref(true)
const activeBox = ref('inbox')
const recipientId = ref('')
const content = ref('')

const router = useRouter()
const authStore = useAuthStore()
const messageStore = useMessageStore()

const messages = computed(() => messageStore.items)

async function goLogin() {
  await router.push('/login')
}

async function loadMessages(box = activeBox.value) {
  activeBox.value = box

  if (!authStore.isAuthenticated) {
    return
  }

  await messageStore.fetchMessages({ box, limit: 50 })
}

async function sendMessage() {
  if (!recipientId.value.trim() || !content.value.trim()) {
    messageStore.error = 'recipientId and content are required'
    return
  }

  await messageStore.sendMessage({
    recipientId: recipientId.value.trim(),
    content: content.value.trim(),
  })

  content.value = ''
  if (activeBox.value === 'sent') {
    await loadMessages('sent')
  }
}

async function markAsRead(messageId) {
  await messageStore.readMessage(messageId)
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

onMounted(() => {
  loadMessages('inbox')
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-3">
      <header class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 class="h4 mb-1">Messages</h1>
          <p class="text-secondary mb-0">Unread inbox: {{ messageStore.unreadCount }}</p>
        </div>
        <div class="btn-group btn-group-sm" role="group" aria-label="Message box switcher">
          <button class="btn" :class="activeBox === 'inbox' ? 'btn-primary' : 'btn-outline-primary'" @click="loadMessages('inbox')">Inbox</button>
          <button class="btn" :class="activeBox === 'sent' ? 'btn-primary' : 'btn-outline-primary'" @click="loadMessages('sent')">Sent</button>
        </div>
      </header>

      <section class="card border-0 shadow-sm">
        <div class="card-body d-grid gap-2">
          <h2 class="h6 mb-0">Compose</h2>
          <div class="row g-2">
            <div class="col-12 col-md-4">
              <input v-model="recipientId" class="form-control form-control-sm" placeholder="Recipient userId" />
            </div>
            <div class="col-12 col-md-8">
              <input v-model="content" class="form-control form-control-sm" placeholder="Write message..." />
            </div>
          </div>
          <div>
            <button class="btn btn-sm btn-primary" @click="sendMessage">Send</button>
          </div>
        </div>
      </section>

      <p v-if="messageStore.loading" class="text-secondary mb-0">Loading messages...</p>
      <p v-else-if="messageStore.error" class="text-danger mb-0">{{ messageStore.error }}</p>

      <div v-else-if="messages.length" class="d-grid gap-2">
        <article
          v-for="item in messages"
          :key="item._id"
          class="card border-0 shadow-sm"
          :class="{ 'message-unread': !item.isRead && activeBox === 'inbox' }"
        >
          <div class="card-body d-grid gap-1">
            <p class="mb-0 fw-semibold">
              {{ activeBox === 'inbox' ? item.sender?.displayName || item.sender?.username : item.recipient?.displayName || item.recipient?.username }}
            </p>
            <p class="mb-0">{{ item.content }}</p>
            <div class="d-flex align-items-center justify-content-between">
              <span class="text-secondary small">{{ new Date(item.createdAt).toLocaleString() }}</span>
              <button
                v-if="activeBox === 'inbox' && !item.isRead"
                class="btn btn-sm btn-outline-secondary"
                @click="markAsRead(item._id)"
              >
                Mark read
              </button>
            </div>
          </div>
        </article>
      </div>

      <p v-else class="text-secondary mb-0">No messages in {{ activeBox }}.</p>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Messages</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.message-unread {
  border-left: 4px solid #3b82f6;
}
</style>
