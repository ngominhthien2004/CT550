<script setup>
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  isManga: {
    type: Boolean,
    default: false,
  },
  isGif: {
    type: Boolean,
    default: false,
  },
  isNovel: {
    type: Boolean,
    default: false,
  },
  titleMax: {
    type: Number,
    default: 32,
  },
  titleCount: {
    type: Number,
    default: 0,
  },
  captionCount: {
    type: Number,
    default: 0,
  },
  novelTextCount: {
    type: Number,
    default: 0,
  },
  seriesList: {
    type: Array,
    default: () => [],
  },
  selectedSeriesId: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['update:selectedSeriesId'])
</script>

<template>
  <div class="details-container d-grid gap-3">
    <!-- Single Box for Title and Caption (Premium Pixiv Aesthetic) -->
    <div class="content-details-card">
      <div class="title-row-wrap">
        <input
          id="upload-title"
          v-model="props.form.title"
          type="text"
          class="title-input-field"
          :maxlength="props.titleMax"
          required
          aria-required="true"
          :placeholder="$t('upload.titlePlaceholder')"
          aria-label="Title"
        />
        <span class="counter-badge">{{ props.titleCount }}/{{ props.titleMax }}</span>
      </div>
      <div class="separator-line"></div>
      <div class="caption-row-wrap">
        <textarea
          id="upload-caption"
          v-model="props.form.caption"
          class="caption-textarea-field"
          rows="5"
          maxlength="3000"
          :placeholder="$t('upload.captionPlaceholder')"
          aria-label="Caption"
        ></textarea>
        <span class="counter-badge bottom-right">{{ props.captionCount }}/3000</span>
      </div>
    </div>

    <!-- Series Card -->
    <div v-if="!props.isNovel" class="additional-settings-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">{{ $t('upload.series') }}</span>
      </div>
      <div class="row-center">
        <div class="row-inline">
          <select :value="props.selectedSeriesId" class="form-select custom-select" aria-label="Select series" @change="emit('update:selectedSeriesId', $event.target.value)">
            <option value="">{{ $t('upload.noSeries') }}</option>
            <option v-for="s in props.seriesList" :key="s._id" :value="s._id">{{ s.title }}</option>
          </select>
          <span class="text-muted small" style="font-size:0.78rem;">{{ $t('upload.orCreateLater') }}</span>
        </div>
      </div>
    </div>

    <!-- Novel Main Text Card -->
    <div v-if="props.isNovel" class="additional-settings-card vertical-layout">
      <div class="row-top">
        <span class="placeholder-badge"></span>
        <label for="upload-novel-text" class="row-label">{{ $t('upload.mainNovelText') }}</label>
      </div>
      <div class="row-bottom">
        <div class="input-with-count position-relative">
          <textarea
            id="upload-novel-text"
            v-model="props.form.novelText"
            class="form-control custom-textarea text-area-large"
            rows="10"
            maxlength="300000"
            :placeholder="$t('upload.writeNovelHere')"
            aria-label="Novel text"
          ></textarea>
          <span class="counter-badge bottom-right-textarea">{{ props.novelTextCount }}/300000</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/upload-form.css"></style>
<style scoped>
.details-container {
  display: grid;
  gap: 0.75rem;
}

/* Premium Pixiv Style Title & Caption Box */
.content-details-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.title-row-wrap {
  position: relative;
  padding: 0.85rem 4.5rem 0.85rem 1rem;
}

.title-input-field {
  width: 100%;
  border: none;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text);
  background: transparent;
  outline: none;
  padding: 0.2rem 0;
}

.title-input-field::placeholder {
  color: var(--muted);
  font-weight: 400;
}

.separator-line {
  height: 1px;
  background-color: var(--line);
  width: 100%;
}

.caption-row-wrap {
  position: relative;
  padding: 0.85rem 1rem 2rem 1rem;
}

.caption-textarea-field {
  width: 100%;
  border: none;
  font-size: 0.95rem;
  color: var(--text);
  background: transparent;
  outline: none;
  resize: vertical;
  min-height: 120px;
}

.caption-textarea-field::placeholder {
  color: var(--muted);
}

.counter-badge {
  position: absolute;
  color: var(--muted);
  font-size: 0.78rem;
  user-select: none;
  pointer-events: none;
}

.title-row-wrap .counter-badge {
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.caption-row-wrap .counter-badge.bottom-right {
  right: 1rem;
  bottom: 0.6rem;
}

/* Additional Settings Cards */
.additional-settings-card {
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.95rem 1.25rem;
  box-shadow: var(--shadow-sm);
}

.additional-settings-card.vertical-layout {
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.row-top {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.row-inline {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  min-width: 0;
  flex-wrap: wrap;
}

.row-center {
  min-width: 0;
}

.row-inline .custom-input {
  flex: 1 1 220px;
  min-width: 0;
}

.row-inline .custom-select {
  flex: 1 1 220px;
  min-width: 0;
}

.row-inline .action-pill {
  flex: 0 0 auto;
  max-width: 100%;
  white-space: normal;
}

.custom-textarea {
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  font-size: 0.88rem;
  color: var(--text);
  transition: border-color 0.2s;
  width: 100%;
}

.custom-textarea:focus {
  border-color: #0076ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 118, 255, 0.15);
}

.text-area-large {
  padding-bottom: 2rem;
}

.counter-badge.bottom-right-textarea {
  right: 1rem;
  bottom: 0.6rem;
}

@media (max-width: 991px) {
  .additional-settings-card {
    grid-template-columns: 1fr;
    gap: 0.65rem;
    align-items: flex-start;
  }
}
</style>
