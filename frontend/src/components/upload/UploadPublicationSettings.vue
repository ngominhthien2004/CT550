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
        <span class="required-badge">Required</span>
        <span class="row-label required-label">Visible to</span>
      </div>
      <div class="row-center">
        <div class="options-group" role="radiogroup" aria-label="Visible to age setting">
          <label class="custom-radio">
            <input v-model="props.form.ageRating" type="radio" name="ageRating" value="all" aria-label="Age rating: all ages" />
            <span class="radio-indicator"></span>
            <span class="radio-label">All ages</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.ageRating" type="radio" name="ageRating" value="r-18" aria-label="Age rating: R-18" />
            <span class="radio-indicator"></span>
            <span class="radio-label">R-18</span>
          </label>
        </div>
      </div>
      <div class="row-right">
        <a href="#" class="row-link" @click.prevent>What are age restrictions?</a>
      </div>
    </div>

    <!-- AI-generated work Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="required-badge">Required</span>
        <span class="row-label required-label">AI-generated work</span>
      </div>
      <div class="row-center">
        <div class="d-flex flex-column gap-1">
          <div class="options-group" role="radiogroup" aria-label="AI generated setting">
            <label class="custom-radio">
            <input v-model="props.form.aiGenerated" type="radio" name="aiGenerated" value="yes" aria-label="AI-generated: yes" />
            <span class="radio-indicator"></span>
            <span class="radio-label">Yes</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.aiGenerated" type="radio" name="aiGenerated" value="no" aria-label="AI-generated: no" />
              <span class="radio-indicator"></span>
              <span class="radio-label">No</span>
            </label>
          </div>
          <!-- Automatically enabled red text below Yes No -->
          <p v-if="props.showAiWarning && props.form.aiGenerated === 'yes'" class="auto-enabled-text mb-0" role="alert">
            Được bật tự động
          </p>
        </div>
      </div>
      <div class="row-right">
        <a href="#" class="row-link" @click.prevent>What is AI-generated work?</a>
      </div>
    </div>

    <!-- Open to Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">Open to</span>
      </div>
      <div class="row-center">
        <div class="options-group" role="radiogroup" aria-label="Post visibility setting">
          <label class="custom-radio">
            <input v-model="props.form.openTo" type="radio" name="openTo" value="public" aria-label="Visibility: public" />
            <span class="radio-indicator"></span>
            <span class="radio-label">Make public</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.openTo" type="radio" name="openTo" value="logged-in" aria-label="Visibility: logged-in users only" />
            <span class="radio-indicator"></span>
            <span class="radio-label">Logged-in users only</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.openTo" type="radio" name="openTo" value="mypixiv" aria-label="Visibility: my pixiv only" />
            <span class="radio-indicator"></span>
            <span class="radio-label">My IlluWrl only</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.openTo" type="radio" name="openTo" value="private" aria-label="Visibility: private" />
            <span class="radio-indicator"></span>
            <span class="radio-label">Private</span>
          </label>
        </div>
      </div>
      <div class="row-right"></div>
    </div>

    <!-- Additional Options Card (Comments, Original Work, Allow Collections) -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">Comments</span>
      </div>
      <div class="row-center">
        <div class="options-group" role="radiogroup" aria-label="Comments setting">
          <label class="custom-radio">
            <input v-model="props.form.comments" type="radio" name="comments" value="on" aria-label="Comments: on" />
            <span class="radio-indicator"></span>
            <span class="radio-label">ON</span>
          </label>
          <label class="custom-radio">
            <input v-model="props.form.comments" type="radio" name="comments" value="off" aria-label="Comments: off" />
            <span class="radio-indicator"></span>
            <span class="radio-label">OFF</span>
          </label>
        </div>
      </div>
      <div class="row-right"></div>
    </div>

    <div class="settings-row-card">
      <div class="row-left"></div>
      <div class="row-center">
        <div class="d-grid gap-2">
          <label class="custom-checkbox">
            <input v-model="props.form.allowCollections" type="checkbox" aria-label="Allow collections" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-label">Allow your works to be featured in other people collections</span>
          </label>
          <label class="custom-checkbox">
            <input v-model="props.form.isOriginalWork" type="checkbox" aria-label="Original work" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-label">Original work</span>
          </label>
        </div>
      </div>
      <div class="row-right"></div>
    </div>

    <!-- Language Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <label for="work-language" class="row-label">Work language</label>
      </div>
      <div class="row-center">
        <select id="work-language" v-model="props.form.language" class="form-select custom-select" aria-label="Work language">
          <option v-for="language in props.languageOptions" :key="language" :value="language">{{ language }}</option>
        </select>
      </div>
      <div class="row-right"></div>
    </div>

    <!-- Schedule Row -->
    <div class="settings-row-card">
      <div class="row-left">
        <span class="placeholder-badge"></span>
        <span class="row-label">Scheduled post</span>
      </div>
      <div class="row-center">
        <div class="d-grid gap-2">
          <label class="custom-checkbox">
            <input v-model="props.form.scheduleEnabled" type="checkbox" aria-label="Schedule submission" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-label">Schedule submission</span>
          </label>
          <div class="d-flex flex-column flex-sm-row gap-2" :class="{ 'opacity-50': !props.form.scheduleEnabled }">
            <input v-model="props.form.scheduleDate" type="date" class="form-control custom-input" :disabled="!props.form.scheduleEnabled" aria-label="Schedule date" />
            <input v-model="props.form.scheduleTime" type="time" class="form-control custom-input" :disabled="!props.form.scheduleEnabled" aria-label="Schedule time" />
          </div>
        </div>
      </div>
      <div class="row-right"></div>
    </div>

    <div v-if="props.isNovel" class="settings-row-card info-row">
      <div class="row-left"></div>
      <div class="row-center">
        <p class="small text-secondary mb-0">Advanced settings for novel publication are applied from the same visibility and language options.</p>
      </div>
      <div class="row-right"></div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  display: grid;
  gap: 0.75rem;
}

.settings-row-card {
  display: grid;
  grid-template-columns: 240px 1fr auto;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.95rem 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.settings-row-card.info-row {
  border: 0;
  background: transparent;
  padding-top: 0;
  padding-bottom: 0;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.required-badge {
  background-color: #ff3b30;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.22rem 0.45rem;
  border-radius: 4px;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  letter-spacing: 0.02em;
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

.row-label.required-label {
  color: #ef4444;
}

.row-center {
  padding-left: 0.5rem;
}

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

.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.88rem;
  color: #334155;
}

.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-indicator {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.custom-checkbox:hover .checkbox-indicator {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.custom-checkbox input:checked ~ .checkbox-indicator {
  border-color: #0076ff;
  background-color: #0076ff;
}

.checkbox-indicator::after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox input:checked ~ .checkbox-indicator::after {
  display: block;
}

.auto-enabled-text {
  color: #ef4444;
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
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.88rem;
  color: #334155;
  background-color: #ffffff;
  transition: border-color 0.2s;
}

.custom-select:focus {
  border-color: #0076ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 118, 255, 0.15);
}

.custom-input {
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

  .placeholder-badge {
    display: none;
  }
}
</style>
