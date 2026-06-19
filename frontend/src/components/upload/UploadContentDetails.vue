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
})
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
          placeholder="Title"
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
          placeholder="Caption"
          aria-label="Caption"
        ></textarea>
        <span class="counter-badge bottom-right">{{ props.captionCount }}/3000</span>
      </div>
    </div>

    <!-- Manga Series Card -->
    <div v-if="props.isManga" class="additional-settings-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">Series</span>
      </div>
      <div class="row-center">
        <div class="row-inline">
          <input v-model="props.form.mangaSeriesName" type="text" class="form-control custom-input" placeholder="Series name" aria-label="Series name" />
          <button type="button" class="btn btn-outline-primary btn-sm custom-btn">Create series</button>
        </div>
      </div>
    </div>

    <!-- Novel Format Card -->
    <div v-if="props.isNovel" class="additional-settings-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">Novel format</span>
      </div>
      <div class="row-center d-flex flex-column gap-2">
        <div class="options-group" role="radiogroup" aria-label="Novel posting format">
          <label class="custom-radio">
            <input v-model="props.form.novelFormat" type="radio" name="novelFormat" value="series" aria-label="Novel format: series" />
            <span class="radio-indicator"></span>
            <span class="radio-label">Series</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.novelFormat" type="radio" name="novelFormat" value="oneshot" aria-label="Novel format: one-shot" />
            <span class="radio-indicator"></span>
            <span class="radio-label">One-shot</span>
          </label>
        </div>
        <div class="row-inline mt-2">
          <input v-model="props.form.novelSeriesName" type="text" class="form-control custom-input" placeholder="Series name" aria-label="Novel series name" />
          <button type="button" class="btn btn-outline-primary btn-sm custom-btn">Create series</button>
        </div>
      </div>
    </div>

    <!-- Novel Main Text Card -->
    <div v-if="props.isNovel" class="additional-settings-card vertical-layout">
      <div class="row-top">
        <span class="placeholder-badge"></span>
        <label for="upload-novel-text" class="row-label">Main novel text</label>
      </div>
      <div class="row-bottom">
        <div class="input-with-count position-relative">
          <textarea
            id="upload-novel-text"
            v-model="props.form.novelText"
            class="form-control custom-textarea text-area-large"
            rows="10"
            maxlength="300000"
            placeholder="Write your novel here."
            aria-label="Novel text"
          ></textarea>
          <span class="counter-badge bottom-right-textarea">{{ props.novelTextCount }}/300000</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.details-container {
  display: grid;
  gap: 0.75rem;
}

/* Premium Pixiv Style Title & Caption Box */
.content-details-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
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
  color: #1e293b;
  background: transparent;
  outline: none;
  padding: 0.2rem 0;
}

.title-input-field::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.separator-line {
  height: 1px;
  background-color: #edf2f7;
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
  color: #334155;
  background: transparent;
  outline: none;
  resize: vertical;
  min-height: 120px;
}

.caption-textarea-field::placeholder {
  color: #94a3b8;
}

.counter-badge {
  position: absolute;
  color: #94a3b8;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.95rem 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.additional-settings-card.vertical-layout {
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.row-left, .row-top {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.placeholder-badge {
  display: inline-block;
  min-width: 62px;
  height: 1px;
}

.row-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: #334155;
}

.row-center {
  padding-left: 0.5rem;
}

.row-inline {
  display: flex;
  gap: 0.65rem;
  align-items: center;
}

.custom-input {
  max-width: 320px;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.88rem;
  color: #334155;
  transition: border-color 0.2s;
}

.custom-input:focus {
  border-color: #0076ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 118, 255, 0.15);
}

.custom-textarea {
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  font-size: 0.88rem;
  color: #334155;
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

.custom-btn {
  border-radius: 6px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s;
  color: #0076ff;
  border-color: #0076ff;
}

.custom-btn:hover {
  background-color: #0076ff;
  color: #ffffff;
}

/* Radio buttons matching settings row */
.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.custom-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.88rem;
  color: #334155;
}

.custom-radio input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.radio-indicator {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
}

.custom-radio:hover .radio-indicator {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.custom-radio input:checked ~ .radio-indicator {
  border-color: #0076ff;
  background-color: #ffffff;
}

.radio-indicator::after {
  content: "";
  position: absolute;
  display: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0076ff;
}

.custom-radio input:checked ~ .radio-indicator::after {
  display: block;
}

@media (max-width: 991px) {
  .additional-settings-card {
    grid-template-columns: 1fr;
    gap: 0.65rem;
    align-items: flex-start;
  }

  .placeholder-badge {
    display: none;
  }
  
  .row-inline {
    flex-wrap: wrap;
  }
}
</style>
