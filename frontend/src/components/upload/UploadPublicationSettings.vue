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
  showAiWarning: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="settings-container d-grid gap-3">
    <!-- Visible to Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="required-badge">{{ $t('upload.required') }}</span>
        <span class="row-label required-label">{{ $t('upload.visibleTo') }}</span>
      </div>
      <div class="row-center">
        <div class="options-group" role="radiogroup" :aria-label="$t('upload.visibleTo')">
          <label class="custom-radio">
            <input v-model="props.form.ageRating" type="radio" name="ageRating" value="all" :aria-label="$t('upload.allAges')" />
            <span class="radio-indicator"></span>
            <span class="radio-label">{{ $t('upload.allAges') }}</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.ageRating" type="radio" name="ageRating" value="r-18" :aria-label="$t('upload.r18')" />
            <span class="radio-indicator"></span>
            <span class="radio-label">{{ $t('upload.r18') }}</span>
          </label>
        </div>
      </div>
      <div class="row-right">
        <a href="#" class="row-link" @click.prevent>{{ $t('upload.whatAgeRestrictions') }}</a>
      </div>
    </div>

    <!-- AI-generated work Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="required-badge">{{ $t('upload.required') }}</span>
        <span class="row-label required-label">{{ $t('upload.aiGenerated') }}</span>
      </div>
      <div class="row-center">
        <div class="d-flex flex-column gap-1">
          <div class="options-group" role="radiogroup" :aria-label="$t('upload.aiGenerated')">
            <label class="custom-radio">
            <input v-model="props.form.aiGenerated" type="radio" name="aiGenerated" value="yes" :aria-label="$t('upload.yes')" />
            <span class="radio-indicator"></span>
            <span class="radio-label">{{ $t('upload.yes') }}</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.aiGenerated" type="radio" name="aiGenerated" value="no" :aria-label="$t('upload.no')" />
              <span class="radio-indicator"></span>
              <span class="radio-label">{{ $t('upload.no') }}</span>
            </label>
          </div>
          <!-- Automatically enabled red text below Yes No -->
          <p v-if="props.showAiWarning && props.form.aiGenerated === 'yes'" class="auto-enabled-text mb-0" role="alert">
            {{ $t('upload.autoEnabled') }}
          </p>
        </div>
      </div>
      <div class="row-right">
        <a href="#" class="row-link" @click.prevent>{{ $t('upload.whatAiGenerated') }}</a>
      </div>
    </div>


    <!-- Comments Section -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">{{ $t('upload.comments') }}</span>
      </div>
      <div class="row-center">
        <div class="options-group" role="radiogroup" :aria-label="$t('upload.comments')">
          <label class="custom-radio">
            <input v-model="props.form.comments" type="radio" name="comments" value="on" :aria-label="$t('upload.on')" />
            <span class="radio-indicator"></span>
            <span class="radio-label">{{ $t('upload.on') }}</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.comments" type="radio" name="comments" value="off" :aria-label="$t('upload.off')" />
            <span class="radio-indicator"></span>
            <span class="radio-label">{{ $t('upload.off') }}</span>
          </label>
        </div>
      </div>
      <div class="row-right"></div>
    </div>

    <!-- Schedule Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">{{ $t('upload.scheduledPost') }}</span>
      </div>
      <div class="row-center">
        <div class="d-grid gap-2">
          <label class="custom-checkbox">
            <input v-model="props.form.scheduleEnabled" type="checkbox" :aria-label="$t('upload.scheduleSubmission')" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-label">{{ $t('upload.scheduleSubmission') }}</span>
          </label>
          <div class="d-flex flex-column flex-sm-row gap-2" :class="{ 'opacity-50': !props.form.scheduleEnabled }">
            <input v-model="props.form.scheduleDate" type="date" class="form-control custom-input" :disabled="!props.form.scheduleEnabled" :aria-label="$t('upload.scheduledPost')" />
            <input v-model="props.form.scheduleTime" type="time" class="form-control custom-input" :disabled="!props.form.scheduleEnabled" aria-label="Schedule time" />
          </div>
        </div>
      </div>
      <div class="row-right"></div>
    </div>

    <div v-if="props.isNovel" class="settings-row-card info-row">
      <div class="row-left"></div>
      <div class="row-center">
        <p class="small text-secondary mb-0">{{ $t('upload.novelPublicationNote') }}</p>
      </div>
      <div class="row-right"></div>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/upload-form.css"></style>
<style scoped>
.settings-container {
  display: grid;
  gap: 0.75rem;
}

.settings-row-card {
  display: grid;
  grid-template-columns: 240px 1fr auto;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.95rem 1.25rem;
  box-shadow: var(--shadow-sm);
}

.settings-row-card.info-row {
  border: 0;
  background: transparent;
  padding-top: 0;
  padding-bottom: 0;
}


.auto-enabled-text {
  color: var(--danger);
  font-size: 0.82rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.row-right {
  display: flex;
  justify-content: flex-end;
  min-width: 160px;
}

.row-link {
  color: #0076ff;
  text-decoration: none;
  font-size: 0.82rem;
}

.row-link:hover {
  text-decoration: underline;
}

.custom-select {
  max-width: 240px;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.88rem;
  color: var(--text);
  background-color: var(--surface);
  transition: border-color 0.2s;
}

.custom-select:focus {
  border-color: #0076ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 118, 255, 0.15);
}

@media (max-width: 991px) {
  .settings-row-card {
    grid-template-columns: 1fr;
    gap: 0.65rem;
    align-items: flex-start;
  }
  
  .row-right {
    justify-content: flex-start;
    min-width: unset;
  }
}
</style>
