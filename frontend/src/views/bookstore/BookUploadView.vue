<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import BookUploadForm from '@/components/bookstore/BookUploadForm.vue'
import BookStoreTopBar from '@/components/bookstore/BookStoreTopBar.vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'
import { toggleNavCollapsed } from '@/utils/viewNavigation.js'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const isNavCollapsed = ref(true)
const initialBook = ref(null)

const editId = computed(() => route.query.edit)
const isEdit = computed(() => Boolean(editId.value))

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

async function handleSubmit(formPayload) {
  try {
    if (isEdit.value) {
      await bookStore.updateBookById(editId.value, formPayload)
      showSuccess('Book updated')
      router.push('/bookstore/manage')
      return
    }

    await bookStore.ensureSeller()
    const created = await bookStore.uploadBook(formPayload)
    showSuccess('Book uploaded')
    const nextId = created?._id || created?.id
    if (nextId) {
      router.push(`/bookstore/${nextId}`)
    } else {
      router.push('/bookstore/manage')
    }
  } catch (error) {
    showError(error?.response?.data?.message || error?.message || 'Failed to save book')
  }
}

async function loadBookForEdit() {
  if (!editId.value) {
    initialBook.value = null
    return
  }

  try {
    await bookStore.fetchBookDetail(editId.value)
    initialBook.value = bookStore.currentBook
  } catch (error) {
    showError('Failed to load book for editing')
  }
}

watch(editId, loadBookForEdit, { immediate: true })

onMounted(async () => {
  // For brand-new users, the seller profile doesn't exist yet — calling
  // ensureSeller() creates it (idempotent) before the template checks
  // for it, so the "Seller profile not found" yellow banner doesn't
  // appear on first visit.
  if (!isEdit.value) {
    try {
      await bookStore.ensureSeller()
    } catch {
      // ensureSeller populates sellerError on failure; the template
      // displays it. Swallow here so onMounted doesn't crash.
    }
  } else {
    await bookStore.fetchSellerProfile()
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <BookStoreTopBar />
    <section class="bookstore-page page-block p-3 p-md-4">
      <h1 class="page-title">{{ isEdit ? 'Edit Book' : 'Upload E-book' }}</h1>
      <p class="page-subtitle">
        {{ isEdit ? 'Update your book details and files.' : 'Become a seller and start distributing your digital books.' }}
      </p>

      <div v-if="bookStore.sellerError && !isEdit" class="alert alert-warning" role="alert">
        {{ bookStore.sellerError }}
      </div>

      <BookUploadForm
        :initial-book="initialBook"
        :loading="bookStore.uploadLoading"
        @submit="handleSubmit"
      />
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.bookstore-page {
  max-width: 900px;
  margin: 0 auto;
  /* Offset for fixed BookStoreTopBar (top: 72px + 60px height) */
  padding-top: 132px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.35rem;
}

.page-subtitle {
  color: var(--muted);
  margin-bottom: 1.25rem;
}
</style>
