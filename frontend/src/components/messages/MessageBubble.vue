<script setup>
import { ref } from 'vue'

const props = defineProps({
  row: { type: Object, required: true },
  currentUserId: { type: String, default: '' },
})

const emit = defineEmits(['reply', 'delete', 'mark-read', 'scroll-images'])

const isOutgoing = () => String(props.row.item?.sender?._id || '') === props.currentUserId
</script>

<template>
  <article
    class="bubble"
    :class="[
      isOutgoing() ? 'outgoing' : 'incoming',
      row._parsed.quote ? 'has-quote' : ''
    ]"
  >
    <img v-if="!isOutgoing()" class="msg-avatar" :src="row.item.sender?.avatar || 'https://s.pximg.net/common/images/no_profile.png'" alt="avatar" @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'" />

    <div v-if="row._parsed.quote" class="bubble-quote">
      <span class="quote-user">
        <i class="fa-solid fa-reply"></i> @{{ row._parsed.quote.user }}
      </span>
      <p class="quote-text">{{ row._parsed.quote.content }}</p>
    </div>

    <div class="bubble-body-wrap">
      <p v-if="row._body.text" class="bubble-body">{{ row._body.text }}</p>
      <div v-if="row.item.images && row.item.images.length" class="bubble-images">
        <img v-for="(imgUrl, idx) in row.item.images" :key="imgUrl || idx" :src="imgUrl" alt="Message image" class="bubble-image" @error="(e) => e.target.style.display = 'none'" @load="emit('scroll-images')" />
      </div>
      <div v-else-if="row._body.images.length" class="bubble-images">
        <img v-for="(imgUrl, idx) in row._body.images" :key="imgUrl || idx" :src="imgUrl" alt="Message image" class="bubble-image" @error="(e) => e.target.style.display = 'none'" @load="emit('scroll-images')" />
      </div>
    </div>

    <div class="bubble-footer">
      <span v-if="isOutgoing()" class="msg-status" :class="{ read: row.item.isRead }">
        <i v-if="row.item.isRead" class="fa-solid fa-check-double" title="Read"></i>
        <i v-else class="fa-solid fa-check" title="Sent"></i>
      </span>
      <small class="msg-time">{{ row._formattedTime }}</small>
    </div>

    <div class="bubble-actions-wrapper">
      <button type="button" class="bubble-reply-btn" title="Reply to this message" @click="emit('reply', row.item)">
        <i class="fa-solid fa-reply"></i>
      </button>
      <button
        v-if="isOutgoing() || String(row.item?.recipient?._id || '') === currentUserId"
        type="button"
        class="bubble-delete-btn"
        title="Delete for me"
        @click.prevent="emit('delete', row.item._id)"
      >
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>

    <button
      v-if="String(row.item?.recipient?._id || '') === currentUserId && !row.item.isRead"
      type="button"
      class="mark-read"
      @click="emit('mark-read', row.item._id)"
    >
      Mark read
    </button>
  </article>
</template>

<style scoped>
.bubble {
  position: relative;
  max-width: 65%;
  padding: 0.65rem 0.9rem;
  border-radius: 16px;
  margin-bottom: 0.35rem;
  word-wrap: break-word;
}

.bubble.incoming {
  background: #f1f5f9;
  color: #1e293b;
  margin-right: auto;
  border-bottom-left-radius: 4px;
}

.bubble.outgoing {
  background: #6366f1;
  color: #fff;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.bubble.has-quote {
  background: color-mix(in srgb, #818cf8 6%, transparent);
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.3rem;
}

.bubble-quote {
  background: rgba(0,0,0,0.05);
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.4rem;
  font-size: 0.82rem;
}

.quote-user {
  color: #6366f1;
  font-weight: 600;
}

.quote-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.82rem;
}

.bubble-body {
  margin: 0;
  line-height: 1.5;
}

.bubble-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.bubble-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.bubble-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.3rem;
  font-size: 0.72rem;
}

.outgoing .bubble-footer {
  justify-content: flex-end;
}

.msg-status {
  font-size: 0.72rem;
}

.msg-status.read {
  color: #a5b4fc;
}

.msg-time {
  opacity: 0.7;
}

.bubble-actions-wrapper {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  z-index: 5;
  padding: 6px;
  margin: -6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}

.bubble.incoming .bubble-actions-wrapper {
  left: calc(100% + 8px);
}

.bubble.outgoing .bubble-actions-wrapper {
  right: calc(100% + 8px);
}

.bubble:hover .bubble-actions-wrapper,
.bubble-actions-wrapper:hover {
  opacity: 1;
  pointer-events: auto;
}

.bubble-reply-btn,
.bubble-delete-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.bubble-reply-btn:hover {
  background: #eff6ff;
  color: #3b82f6;
  border-color: #bfdbfe;
}

.bubble-delete-btn:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.mark-read {
  border: none;
  background: transparent;
  color: #6366f1;
  font-size: 0.72rem;
  cursor: pointer;
}
</style>
