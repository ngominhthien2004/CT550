<template>
  <div class="ai-test-page">
    <div class="container">
      <h1>Test AI Features</h1>
      
      <div class="tabs">
        <button type="button" 
          :class="['tab', { active: activeTab === 'chat' }]" 
          @click="activeTab = 'chat'"
        >
          AI Chat
        </button>
        <button type="button" 
          :class="['tab', { active: activeTab === 'detect' }]" 
          @click="activeTab = 'detect'"
        >
          Phát hiện ảnh AI
        </button>
      </div>

      <div v-if="activeTab === 'chat'" class="tab-content">
        <div class="chat-container">
          <div class="messages">
            <div v-if="messages.length === 0" class="welcome-msg">
              👋 Xin chào! Tôi có thể giúp bạn tìm tác phẩm, gợi ý tác phẩm hay.
            </div>
            <div v-for="(msg, i) in messages" :key="'msg-' + i" :class="['message', msg.role]">
              <div class="msg-content">{{ msg.content }}</div>
            </div>
            <div v-if="loading" class="message assistant">
              <div class="msg-content">...</div>
            </div>
          </div>
          
          <form @submit.prevent="sendMessage" class="chat-input">
            <input 
              v-model="inputMessage" 
              placeholder="Nhập tin nhắn..." 
              :disabled="loading"
              aria-label="Chat message input"
            />
            <button type="submit" :disabled="loading || !inputMessage.trim()">
              Gửi
            </button>
          </form>
        </div>
      </div>

      <div v-if="activeTab === 'detect'" class="tab-content">
        <div class="detect-container">
          <div class="upload-area" @click="triggerFileInput" @keydown.enter.prevent="triggerFileInput" @keydown.space.prevent="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop" tabindex="0" role="button">
            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              @change="handleFileSelect" 
              hidden
              aria-label="Upload image for AI detection"
            />
            <div v-if="!previewImage" class="upload-placeholder">
              <span class="upload-icon">📁</span>
              <p>Click hoặc kéo ảnh vào đây</p>
              <p class="hint">Hỗ trợ: JPG, PNG, GIF, WEBP</p>
            </div>
            <img v-else :src="previewImage" alt="Preview" class="preview-image" />
          </div>

          <button type="button" 
            v-if="previewImage" 
            @click="clearImage" 
            class="clear-btn"
          >
            Xóa ảnh
          </button>

          <button type="button" 
            v-if="previewImage && !isAnalyzing" 
            @click="analyzeImage" 
            class="analyze-btn"
          >
            Phân tích ảnh
          </button>

          <div v-if="isAnalyzing" class="loading">
            <div class="spinner"></div>
            <p>Đang phân tích...</p>
          </div>

          <div v-if="result" :class="['result', result.isAI ? 'ai-detected' : 'real-image']">
            <div class="result-header">
              <span v-if="result.isAI" class="badge ai">⚠️ Ảnh AI</span>
              <span v-else class="badge real">✅ Ảnh thật</span>
              <span class="confidence">{{ result.confidence }}% độ tin cậy</span>
            </div>
            <p class="reason">{{ result.reason }}</p>
            <div class="result-details" v-if="result.imageSize">
              <span>Kích thước: {{ formatSize(result.imageSize) }}</span>
              <span>Loại: {{ result.imageType }}</span>
            </div>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

const activeTab = ref('detect')

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return
  
  const userMsg = inputMessage.value
  messages.value.push({ role: 'user', content: userMsg })
  inputMessage.value = ''
  loading.value = true

  try {
    const history = messages.value.map(m => ({ role: m.role, content: m.content }))
    const { data } = await api.post('/ai/chat', { message: userMsg, history })
    messages.value.push({ role: 'assistant', content: data.reply })
  } catch (err) {
    messages.value.push({ role: 'assistant', content: 'Có lỗi xảy ra. Vui lòng thử lại.' })
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const isAnalyzing = ref(false)
const result = ref(null)
const error = ref(null)

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

function handleDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file) {
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
  result.value = null
  error.value = null
}

function clearImage() {
  previewImage.value = null
  selectedFile.value = null
  result.value = null
  error.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function analyzeImage() {
  if (!selectedFile.value) return

  isAnalyzing.value = true
  error.value = null
  result.value = null

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)

    const { data } = await api.post('/ai/detect-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    result.value = data
  } catch (err) {
    error.value = err.response?.data?.message || 'Có lỗi xảy ra khi phân tích ảnh'
    console.error(err)
  } finally {
    isAnalyzing.value = false
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.ai-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tab.active {
  background: #4a90d9;
}

.tab-content {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.welcome-msg {
  color: #aaa;
  text-align: center;
  padding: 20px;
}

.message {
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.msg-content {
  padding: 10px 15px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message.user .msg-content {
  background: #4a90d9;
  color: #fff;
}

.message.assistant .msg-content {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
}

.chat-input input::placeholder {
  color: #aaa;
}

.chat-input button {
  padding: 12px 25px;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.chat-input button:disabled {
  background: #666;
  cursor: not-allowed;
}

.detect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.upload-area {
  width: 100%;
  max-width: 400px;
  height: 300px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #4a90d9;
  background: rgba(74, 144, 217, 0.1);
}

.upload-placeholder {
  text-align: center;
  color: #aaa;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.hint {
  font-size: 0.85rem;
  margin-top: 10px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.clear-btn, .analyze-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.clear-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.analyze-btn {
  background: #4a90d9;
  color: #fff;
}

.analyze-btn:hover {
  background: #357abd;
}

.loading {
  text-align: center;
  color: #fff;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4a90d9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result {
  width: 100%;
  max-width: 500px;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.result.ai-detected {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.result.real-image {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
}

.result-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
}

.badge.ai {
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
}

.badge.real {
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
}

.confidence {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.reason {
  color: #fff;
  line-height: 1.6;
}

.result-details {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.error {
  color: #ff6b6b;
  text-align: center;
}
</style>