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

onMounted(() => {
  bookStore.fetchSellerProfile()
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
