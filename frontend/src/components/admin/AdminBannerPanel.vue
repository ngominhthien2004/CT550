<script setup>
import { ref, watch } from 'vue'
import { bannerApi } from '../../services/api'

const props = defineProps({
  activeTab: { type: String, required: true },
})

const banners = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMsg = ref('')

// Form state
const editMode = ref(false) // false = creating, string = editing banner ID
const formTitle = ref('')
const formDescription = ref('')
const formLink = ref('')
const formSortOrder = ref(0)
const formIsActive = ref(true)
const formType = ref('home')
const formImage = ref(null) // File object for new upload
const previewImage = ref('') // URL for preview

async function loadBanners() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await bannerApi.getAll()
    banners.value = Array.isArray(data) ? data : []
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to load banners'
  } finally {
    loading.value = false
  }
}

function startCreate() {
  editMode.value = 'new'
  formTitle.value = ''
  formDescription.value = ''
  formLink.value = ''
  formSortOrder.value = 0
  formIsActive.value = true
  formType.value = 'home'
  formImage.value = null
  previewImage.value = ''
  error.value = ''
  successMsg.value = ''
}

function startEdit(banner) {
  editMode.value = banner._id
  formTitle.value = banner.title || ''
  formDescription.value = banner.description || ''
  formLink.value = banner.link || ''
  formSortOrder.value = banner.sortOrder || 0
  formIsActive.value = banner.isActive !== undefined ? banner.isActive : true
  formType.value = banner.type || 'home'
  formImage.value = null
  previewImage.value = banner.image || ''
  error.value = ''
  successMsg.value = ''
}

function cancelForm() {
  editMode.value = false
  formImage.value = null
  previewImage.value = ''
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    formImage.value = file
    previewImage.value = URL.createObjectURL(file)
  }
}

async function saveBanner() {
  if (!formLink.value.trim()) {
    error.value = 'Link is required'
    return
  }

  if ((!editMode.value || editMode.value === 'new') && !formImage.value) {
    error.value = 'Banner image is required'
    return
  }

  saving.value = true
  error.value = ''
  successMsg.value = ''

  try {
    const linkValue = formLink.value.trim()
    const normalizedLink = linkValue && !linkValue.startsWith('http') && !linkValue.startsWith('/')
      ? 'https://' + linkValue
      : linkValue
    const formData = new FormData()
    formData.append('link', normalizedLink)
    formData.append('title', formTitle.value)
    formData.append('description', formDescription.value)
    formData.append('sortOrder', String(formSortOrder.value))
    formData.append('isActive', formIsActive.value ? 'true' : 'false')
    formData.append('type', formType.value)

    if (formImage.value) {
      formData.append('image', formImage.value)
    }

    if (editMode.value && editMode.value !== 'new') {
      await bannerApi.update(editMode.value, formData)
      successMsg.value = 'Banner updated successfully'
    } else {
      await bannerApi.create(formData)
      successMsg.value = 'Banner created successfully'
    }

  editMode.value = false
    formImage.value = null
    previewImage.value = ''
    setTimeout(() => { successMsg.value = '' }, 3000)
    await loadBanners()
  } catch (saveError) {
    error.value = saveError?.response?.data?.message || 'Failed to save banner'
  } finally {
    saving.value = false
  }
}

async function confirmDelete(banner) {
  if (!window.confirm(`Delete banner "${banner.title || 'Untitled'}"? This cannot be undone.`)) return

  saving.value = true
  error.value = ''
  try {
    await bannerApi.delete(banner._id)
    successMsg.value = 'Banner deleted'
    setTimeout(() => { successMsg.value = '' }, 3000)
    await loadBanners()
  } catch (deleteError) {
    error.value = deleteError?.response?.data?.message || 'Failed to delete banner'
  } finally {
    saving.value = false
  }
}

watch(() => props.activeTab, (tab) => {
  if (tab === 'banners') {
    loadBanners()
  }
})
</script>

<template>
  <section v-if="activeTab === 'banners'" id="admin-panel-banners" role="tabpanel" class="admin-panel">
    <div v-if="loading && !banners.length" class="admin-panel-loading">Loading banners...</div>

    <template v-else>
      <div class="banners-header">
        <h2>Banner Management</h2>
        <p class="text-secondary">Manage homepage hero banners — add, edit, reorder, or remove promotional banners.</p>
      </div>

      <p v-if="error" class="error-note">{{ error }}</p>
      <p v-if="successMsg" class="success-note">{{ successMsg }}</p>

      <!-- List view -->
      <div v-if="!editMode">
        <button type="button" class="btn btn-sm btn-primary mb-3" @click="startCreate" :disabled="saving">
          + Add Banner
        </button>

        <div v-if="banners.length === 0" class="text-secondary py-4 text-center">
          No banners yet. Click "Add Banner" to create one.
        </div>

        <table v-else class="banners-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Link</th>
              <th>Type</th>
              <th>Active</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="banner in banners" :key="banner._id">
              <td class="banner-preview-cell">
                <span v-if="banner.image" class="banner-filename" :title="banner.image">{{ banner.image.split('/').pop() }}</span>
                <span v-else class="text-muted small">No image</span>
              </td>
              <td>{{ banner.title || '(untitled)' }}</td>
              <td class="banner-link-cell">{{ banner.link }}</td>
              <td>{{ banner.type || 'home' }}</td>
              <td>
                <span :class="banner.isActive ? 'status-active' : 'status-inactive'">
                  {{ banner.isActive ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>{{ banner.sortOrder }}</td>
              <td class="banner-actions-cell">
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="startEdit(banner)" :disabled="saving">Edit</button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(banner)" :disabled="saving">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Form view -->
      <div v-else class="banner-form">
        <h3>{{ editMode === 'new' ? 'Add New Banner' : 'Edit Banner' }}</h3>

        <div class="banner-form-group">
          <label>Banner Image</label>
          <div v-if="previewImage" class="banner-preview-wrapper">
            <img :src="previewImage" alt="Banner preview" class="banner-preview-img" />
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="handleFileSelect" class="form-control" />
          <span class="text-secondary small">Recommended: wide landscape (e.g., 1400×400). Max 10MB.</span>
        </div>

        <div class="banner-form-group">
          <label for="banner-title">Title</label>
          <input id="banner-title" v-model="formTitle" type="text" class="form-control" placeholder="e.g. Featured Gallery" />
        </div>

        <div class="banner-form-group">
          <label for="banner-link">Link <span class="text-danger">*</span></label>
          <input id="banner-link" v-model="formLink" type="text" class="form-control" placeholder="e.g. /discovery or https://example.com" />
        </div>

        <div class="banner-form-group">
          <label for="banner-type">Page</label>
          <select id="banner-type" v-model="formType" class="form-control">
            <option value="home">Home</option>
            <option value="illust">Illustrations</option>
            <option value="manga">Manga</option>
            <option value="gif">GIF</option>
            <option value="novel">Novel</option>
          </select>
        </div>

        <div class="banner-form-row">
          <div class="banner-form-group">
            <label for="banner-order">Sort Order</label>
            <input id="banner-order" v-model.number="formSortOrder" type="number" class="form-control" min="0" />
          </div>
          <div class="banner-form-group">
            <label class="d-flex align-items-center gap-2">
              <input type="checkbox" v-model="formIsActive" class="form-check-input" />
              <span>Active</span>
            </label>
          </div>
        </div>

        <div class="banner-form-actions">
          <button type="button" class="btn btn-primary" @click="saveBanner" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Banner' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="cancelForm" :disabled="saving">Cancel</button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.banners-header {
  margin-bottom: 1rem;
}
.banners-header h2 {
  margin-bottom: 0.25rem;
}
.banners-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.banners-table th,
.banners-table td {
  text-align: left;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--line);
}
.banners-table th {
  font-weight: 700;
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.banner-preview-cell {
  width: 120px;
}
.banner-link-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.banner-actions-cell {
  display: flex;
  gap: 0.3rem;
}
.status-active {
  color: #155724;
  font-weight: 600;
}
.status-inactive {
  color: #856404;
  font-weight: 600;
}
.banner-form {
  max-width: 600px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1.5rem;
}
.banner-form h3 {
  margin-bottom: 1.25rem;
}
.banner-form-group {
  margin-bottom: 1rem;
}
.banner-form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.88rem;
  margin-bottom: 0.25rem;
}
.banner-form-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
}
.banner-form-row .banner-form-group {
  flex: 1;
}
.banner-form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.banner-preview-wrapper {
  margin-bottom: 0.5rem;
}
.banner-preview-img {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--line);
}
.success-note {
  color: #155724;
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
.error-note {
  color: var(--danger);
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
</style>
