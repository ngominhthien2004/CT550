<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  request: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  activeRole: { type: String, default: 'creator' },
})

const emit = defineEmits(['close', 'action', 'send-chat'])

const activeTab = ref('details')
const newMessage = ref('')
const chatFiles = ref([])
const sendingMessage = ref(false)
const chatMessages = ref([])
const chatLoading = ref(false)

const fileArrays = computed(() => {
  if (!props.request) return []
  return [
    ...(props.request.referenceImages?.length ? [{ label: 'Reference Images', files: props.request.referenceImages }] : []),
    ...(props.request.draftFiles?.length ? [{ label: 'Draft Files', files: props.request.draftFiles }] : []),
    ...(props.request.finalFiles?.length ? [{ label: 'Final Files', files: props.request.finalFiles }] : []),
    ...(props.request.giftFiles?.length ? [{ label: 'Gift Files', files: props.request.giftFiles }] : []),
  ]
})

const hasFiles = computed(() => fileArrays.value.length > 0)

const otherParty = computed(() => {
  if (!props.request) return ''
  if (props.activeRole === 'creator') {
    return props.request.requester?.displayName || props.request.requester?.username || 'Requester'
  }
  return props.request.creator?.displayName || props.request.creator?.username || 'Creator'
})

function statusLabel(value) {
  return String(value || '').replace(/_/g, ' ')
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType) {
  if (!mimeType) return 'fa-regular fa-file'
  if (mimeType.startsWith('image/')) return 'fa-regular fa-file-image'
  if (mimeType === 'application/pdf') return 'fa-regular fa-file-pdf'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'fa-regular fa-file-zipper'
  return 'fa-regular fa-file'
}

function isImage(mimeType) {
  return mimeType?.startsWith('image/')
}

function handleChatFileChange(event) {
  chatFiles.value = Array.from(event.target.files || [])
}

async function sendMessage() {
  if (sendingMessage.value) return
  if (!newMessage.value.trim() && chatFiles.value.length === 0) return

  sendingMessage.value = true
  try {
    const fd = new FormData()
    if (newMessage.value.trim()) fd.append('content', newMessage.value.trim())
    for (const file of chatFiles.value) {
      fd.append('attachments', file)
    }
    emit('send-chat', fd)
    newMessage.value = ''
    chatFiles.value = []
  } finally {
    sendingMessage.value = false
  }
}

function resetRequestPanel() {
  activeTab.value = 'details'
  chatMessages.value = []
  newMessage.value = ''
  chatFiles.value = []
}

watch(() => props.request?._id, resetRequestPanel)

function updateChatMessages(messages) {
  chatMessages.value = messages
}

function setChatLoading(val) {
  chatLoading.value = val
}

defineExpose({ updateChatMessages, setChatLoading })
</script>

<template>
  <aside v-if="request" class="detail-panel" role="dialog" aria-label="Request detail">
    <header class="panel-header">
      <div>
        <h2>{{ request.title }}</h2>
        <p class="meta">
          <span class="status-badge">{{ statusLabel(request.status) }}</span>
          {{ request.workType }} · {{ request.currency }} {{ request.proposedAmount }}
        </p>
      </div>
      <button class="close-btn" title="Close" @click="emit('close')">&times;</button>
    </header>

    <div class="tabs">
      <button :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'">Details</button>
      <button :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">Chat</button>
    </div>

    <!-- Details Tab -->
    <div v-show="activeTab === 'details'" class="tab-content details-tab">
      <section class="info-section">
        <h3>Request Info</h3>
        <dl class="info-grid">
          <dt>Status</dt><dd><span class="status-badge">{{ statusLabel(request.status) }}</span></dd>
          <dt>Work Type</dt><dd>{{ request.workType }}</dd>
          <dt>Amount</dt><dd>{{ request.currency }} {{ request.proposedAmount }}</dd>
          <dt>{{ activeRole === 'creator' ? 'Requester' : 'Creator' }}</dt><dd>{{ otherParty }}</dd>
          <dt v-if="request.description">Description</dt>
          <dd v-if="request.description" class="desc-text">{{ request.description }}</dd>
        </dl>
      </section>

      <section v-if="request.specifics" class="info-section">
        <h3>Specifics</h3>
        <dl class="info-grid">
          <template v-for="(val, key) in request.specifics" :key="key">
            <dt v-if="val">{{ key }}</dt>
            <dd v-if="val">{{ val }}</dd>
          </template>
        </dl>
      </section>

      <!-- Files Section -->
      <section v-if="hasFiles" class="info-section">
        <h3>Files</h3>
        <div v-for="group in fileArrays" :key="group.label" class="file-group">
          <h4>{{ group.label }} ({{ group.files.length }})</h4>
          <div class="file-grid">
            <template v-for="(file, idx) in group.files" :key="idx">
              <a v-if="isImage(file.mimeType)" :href="file.url" target="_blank" class="file-thumb" :title="file.originalName || file.url">
                <img :src="file.url" :alt="file.originalName || 'Reference image'" loading="lazy" />
                <span class="file-name">{{ file.originalName || 'Image' }}</span>
              </a>
              <a v-else :href="file.url" target="_blank" class="file-link" download>
                <i :class="fileIcon(file.mimeType)"></i>
                <span class="file-name">{{ file.originalName || 'File' }}</span>
                <span v-if="file.size" class="file-size">{{ formatFileSize(file.size) }}</span>
              </a>
            </template>
          </div>
        </div>
      </section>
    </div>

    <!-- Chat Tab -->
    <div v-show="activeTab === 'chat'" class="tab-content chat-tab">
      <div class="chat-messages" ref="chatContainer">
        <p v-if="chatLoading" class="state-note">Loading messages...</p>
        <p v-else-if="chatMessages.length === 0" class="state-note">No messages yet.</p>
        <div v-for="msg in chatMessages" :key="msg._id">
          <!-- System message -->
          <div v-if="msg.isSystem" class="chat-message system-message">
            <i class="fa-regular fa-info-circle"></i>
            <span class="msg-content">{{ msg.content }}</span>
            <span class="msg-time">{{ new Date(msg.createdAt).toLocaleString() }}</span>
          </div>
          <!-- User message -->
          <div v-else class="chat-message">
            <div class="msg-header">
              <strong>{{ msg.sender?.displayName || msg.sender?.username || 'Unknown' }}</strong>
              <span class="msg-time">{{ new Date(msg.createdAt).toLocaleString() }}</span>
            </div>
            <p v-if="msg.content" class="msg-content">{{ msg.content }}</p>
            <div v-if="msg.attachments?.length" class="msg-attachments">
              <a
                v-for="(att, attIdx) in msg.attachments"
                :key="attIdx"
                :href="att.url"
                target="_blank"
                class="att-link"
              >
                <i :class="fileIcon(att.mimeType)"></i>
                {{ att.originalName || 'Attachment' }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <form class="chat-input" @submit.prevent="sendMessage">
        <textarea
          v-model="newMessage"
          placeholder="Type a message..."
          rows="2"
          :disabled="sendingMessage"
        ></textarea>
        <div class="chat-input-actions">
          <label class="file-btn" title="Attach file">
            <i class="fa-regular fa-paperclip"></i>
            <input type="file" multiple :accept="'image/*,.pdf,.zip,.psd,.clip'" @change="handleChatFileChange" hidden />
          </label>
          <span v-if="chatFiles.length" class="file-count">{{ chatFiles.length }} file(s)</span>
          <button type="submit" class="send-btn" :disabled="(!newMessage.trim() && !chatFiles.length) || sendingMessage">
            <i class="fa-regular fa-paper-plane"></i> Send
          </button>
        </div>
      </form>
    </div>
  </aside>
</template>

<style scoped>
.detail-panel {
  border: 1px solid #d8e1ef;
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 160px);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0.5rem;
  border-bottom: 1px solid #edf0f4;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.3;
}

.panel-header .meta {
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.78rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.1rem 0.35rem;
  line-height: 1;
}
.close-btn:hover { color: #334155; }

.tabs {
  display: flex;
  border-bottom: 1px solid #edf0f4;
}
.tabs button {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.55rem;
  font-weight: 700;
  font-size: 0.82rem;
  color: #64748b;
  cursor: pointer;
}
.tabs button.active {
  color: #0096fa;
  border-bottom-color: #0096fa;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
}

.info-section {
  margin-bottom: 1rem;
}
.info-section h3 {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.4rem;
}

.info-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  font-size: 0.85rem;
}
.info-grid dt {
  color: #64748b;
  font-weight: 600;
}
.info-grid dd {
  margin: 0;
}

.status-badge {
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.2rem 0.5rem;
  background: #ecfeff;
  color: #0f766e;
  display: inline-block;
}

.desc-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

.file-group {
  margin-bottom: 0.75rem;
}
.file-group h4 {
  font-size: 0.8rem;
  color: #475569;
  margin: 0 0 0.4rem;
}

.file-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.file-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  padding: 0.25rem;
}
.file-thumb img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}
.file-thumb .file-name {
  font-size: 0.7rem;
  color: #64748b;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-decoration: none;
  color: #334155;
  font-size: 0.8rem;
}
.file-link i { font-size: 1rem; color: #64748b; }
.file-link:hover { background: #f8fafc; }
.file-size {
  color: #94a3b8;
  font-size: 0.72rem;
  margin-left: auto;
}

/* Chat Tab */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.chat-message {
  border: 1px solid #edf0f4;
  border-radius: 10px;
  padding: 0.5rem 0.7rem;
}
.chat-message.system-message {
  background: #f8fafc;
  border-color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
  padding: 0.4rem 0.7rem;
}
.chat-message.system-message i {
  color: #94a3b8;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.chat-message.system-message .msg-content {
  flex: 1;
  margin: 0;
  font-size: 0.8rem;
}
.chat-message.system-message .msg-time {
  flex-shrink: 0;
}
.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
}
.msg-time {
  color: #94a3b8;
  font-size: 0.72rem;
}
.msg-content {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  white-space: pre-wrap;
}
.msg-attachments {
  margin-top: 0.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.att-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  padding: 0.2rem 0.5rem;
  background: #f1f5f9;
  border-radius: 6px;
  text-decoration: none;
  color: #334155;
}

.chat-input {
  border-top: 1px solid #edf0f4;
  padding-top: 0.5rem;
}
.chat-input textarea {
  width: 100%;
  border: 1px solid #d8e1ef;
  border-radius: 8px;
  padding: 0.5rem;
  font: inherit;
  font-size: 0.85rem;
  resize: vertical;
}
.chat-input-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
}
.file-btn {
  cursor: pointer;
  color: #64748b;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
}
.file-count {
  font-size: 0.75rem;
  color: #64748b;
}
.send-btn {
  margin-left: auto;
  border: none;
  border-radius: 999px;
  background: #0096fa;
  color: #fff;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.send-btn:disabled { opacity: 0.5; cursor: default; }

.state-note {
  color: #94a3b8;
  font-size: 0.82rem;
  text-align: center;
  padding: 1rem;
}
</style>
