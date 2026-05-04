<script setup>
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  isNovel: {
    type: Boolean,
    default: false,
  },
  languageOptions: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="upload-card">
    <div class="upload-row">
      <span class="row-label">Visible to</span>
      <div class="row-content d-flex flex-wrap gap-3" role="radiogroup" aria-label="Visible to age setting">
        <label class="form-check">
          <input v-model="props.form.ageRating" class="form-check-input" type="radio" name="ageRating" value="all" />
          <span class="form-check-label">All ages</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.ageRating" class="form-check-input" type="radio" name="ageRating" value="r-18" />
          <span class="form-check-label">R-18</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.ageRating" class="form-check-input" type="radio" name="ageRating" value="r-18g" />
          <span class="form-check-label">R-18G</span>
        </label>
      </div>
    </div>

    <div class="upload-row">
      <span class="row-label">AI-generated work</span>
      <div class="row-content d-flex flex-wrap gap-3" role="radiogroup" aria-label="AI generated setting">
        <label class="form-check">
          <input v-model="props.form.aiGenerated" class="form-check-input" type="radio" name="aiGenerated" value="yes" />
          <span class="form-check-label">Yes</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.aiGenerated" class="form-check-input" type="radio" name="aiGenerated" value="no" />
          <span class="form-check-label">No</span>
        </label>
      </div>
    </div>

    <div class="upload-row">
      <span class="row-label">Open to</span>
      <div class="row-content d-flex flex-wrap gap-3" role="radiogroup" aria-label="Post visibility setting">
        <label class="form-check">
          <input v-model="props.form.openTo" class="form-check-input" type="radio" name="openTo" value="public" />
          <span class="form-check-label">Public</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.openTo" class="form-check-input" type="radio" name="openTo" value="logged-in" />
          <span class="form-check-label">Logged-in users only</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.openTo" class="form-check-input" type="radio" name="openTo" value="mypixiv" />
          <span class="form-check-label">My IlluWrl only</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.openTo" class="form-check-input" type="radio" name="openTo" value="private" />
          <span class="form-check-label">Private</span>
        </label>
      </div>
    </div>

    <div class="upload-row">
      <span class="row-label">Comments</span>
      <div class="row-content d-flex flex-wrap gap-3" role="radiogroup" aria-label="Comments setting">
        <label class="form-check">
          <input v-model="props.form.comments" class="form-check-input" type="radio" name="comments" value="on" />
          <span class="form-check-label">ON</span>
        </label>
        <label class="form-check">
          <input v-model="props.form.comments" class="form-check-input" type="radio" name="comments" value="off" />
          <span class="form-check-label">OFF</span>
        </label>
      </div>
    </div>

    <div class="upload-row">
      <span class="row-label"></span>
      <div class="row-content d-grid gap-2">
        <label class="form-check mb-0">
          <input v-model="props.form.allowCollections" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Allow your works to be featured in other people collections</span>
        </label>
        <label class="form-check mb-0">
          <input v-model="props.form.isOriginalWork" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Original work</span>
        </label>
      </div>
    </div>

    <div class="upload-row">
      <label for="work-language" class="row-label">Work language</label>
      <div class="row-content">
        <select id="work-language" v-model="props.form.language" class="form-select">
          <option v-for="language in props.languageOptions" :key="language" :value="language">{{ language }}</option>
        </select>
      </div>
    </div>

    <div class="upload-row">
      <span class="row-label">Scheduled post</span>
      <div class="row-content d-grid gap-2">
        <label class="form-check mb-0">
          <input v-model="props.form.scheduleEnabled" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Schedule submission</span>
        </label>
        <div class="d-flex flex-column flex-sm-row gap-2" :class="{ 'opacity-50': !props.form.scheduleEnabled }">
          <input v-model="props.form.scheduleDate" type="date" class="form-control" :disabled="!props.form.scheduleEnabled" aria-label="Schedule date" />
          <input v-model="props.form.scheduleTime" type="time" class="form-control" :disabled="!props.form.scheduleEnabled" aria-label="Schedule time" />
        </div>
      </div>
    </div>

    <div v-if="props.isNovel" class="upload-row">
      <span class="row-label"></span>
      <p class="row-content small text-secondary mb-0">Advanced settings for novel publication are applied from the same visibility and language options.</p>
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

@media (max-width: 767px) {
  .upload-row {
    grid-template-columns: 1fr;
  }

  .row-label {
    border-right: 0;
    border-bottom: 1px solid #edf2f8;
    padding-bottom: 0.45rem;
  }
}
</style>
