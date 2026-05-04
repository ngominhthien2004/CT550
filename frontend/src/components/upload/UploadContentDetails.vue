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
  isUgoira: {
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
  <div class="upload-card">
    <div class="upload-row">
      <label for="upload-title" class="row-label">Title</label>
      <div class="row-content">
        <div class="input-with-count">
          <input
            id="upload-title"
            v-model="props.form.title"
            type="text"
            class="form-control"
            :maxlength="props.titleMax"
            required
            aria-required="true"
            placeholder="Artwork title"
          />
          <span class="counter">{{ props.titleCount }}/{{ props.titleMax }}</span>
        </div>
      </div>
    </div>

    <div class="upload-row">
      <label for="upload-caption" class="row-label">Caption</label>
      <div class="row-content">
        <div class="input-with-count align-top">
          <textarea
            id="upload-caption"
            v-model="props.form.caption"
            class="form-control"
            rows="4"
            maxlength="3000"
            placeholder="Describe your artwork"
          ></textarea>
          <span class="counter">{{ props.captionCount }}/3000</span>
        </div>
      </div>
    </div>

    <div v-if="props.isManga" class="upload-row">
      <label class="row-label">Series</label>
      <div class="row-content row-inline">
        <input v-model="props.form.mangaSeriesName" type="text" class="form-control" placeholder="Series name" />
        <button type="button" class="btn btn-outline-secondary btn-sm">Create series</button>
      </div>
    </div>

    <div v-if="props.isUgoira" class="upload-row">
      <label for="ugoira-notes" class="row-label">Ugoira notes</label>
      <div class="row-content">
        <textarea
          id="ugoira-notes"
          v-model="props.form.ugoiraNotes"
          class="form-control"
          rows="3"
          placeholder="Playback notes, frame timing notes, or loop info."
        ></textarea>
      </div>
    </div>

    <div v-if="props.isNovel" class="upload-row">
      <label class="row-label">Novel format</label>
      <div class="row-content">
        <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-label="Novel posting format">
          <label class="form-check">
            <input v-model="props.form.novelFormat" class="form-check-input" type="radio" name="novelFormat" value="series" />
            <span class="form-check-label">Series</span>
          </label>
          <label class="form-check">
            <input v-model="props.form.novelFormat" class="form-check-input" type="radio" name="novelFormat" value="oneshot" />
            <span class="form-check-label">One-shot</span>
          </label>
        </div>
        <div class="row-inline mt-2">
          <input v-model="props.form.novelSeriesName" type="text" class="form-control" placeholder="Series name" />
          <button type="button" class="btn btn-outline-secondary btn-sm">Create series</button>
        </div>
      </div>
    </div>

    <div v-if="props.isNovel" class="upload-row">
      <label for="upload-novel-text" class="row-label">Main novel text</label>
      <div class="row-content">
        <div class="input-with-count align-top">
          <textarea
            id="upload-novel-text"
            v-model="props.form.novelText"
            class="form-control"
            rows="10"
            maxlength="300000"
            placeholder="Write your novel here."
          ></textarea>
          <span class="counter">{{ props.novelTextCount }}/300000</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-card {
  border: 1px solid #dce4ee;
  border-radius: 8px;
  background: #fff;
}

.upload-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  border-bottom: 1px solid #edf2f8;
}

.upload-row:last-child {
  border-bottom: 0;
}

.row-label {
  padding: 0.75rem 0.9rem;
  color: #6b7280;
  font-size: 0.84rem;
  border-right: 1px solid #edf2f8;
}

.row-content {
  padding: 0.55rem 0.8rem;
}

.row-inline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-with-count {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-with-count.align-top {
  align-items: flex-start;
}

.counter {
  color: #9ca3af;
  font-size: 0.8rem;
  min-width: 4.8rem;
  text-align: right;
}

@media (max-width: 767px) {
  .upload-row {
    grid-template-columns: 1fr;
  }

  .row-label {
    border-right: 0;
    border-bottom: 1px solid #edf2f8;
    padding-bottom: 0.45rem;
  }

  .row-inline,
  .input-with-count {
    flex-direction: column;
    align-items: stretch;
  }

  .counter {
    text-align: left;
  }
}
</style>
