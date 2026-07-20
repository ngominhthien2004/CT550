<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import BookUploadForm from '@/components/bookstore/BookUploadForm.vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const initialBook = ref(null)

const editId = computed(() => route.query.edit)
const isEdit = computed(() => Boolean(editId.value))

async function handleSubmit(formPayload) {
  try {
    if (isEdit.value) {
      await bookStore.updateBookById(editId.value, formPayload)
      showSuccess(t('bookstore.save'))
      router.push('/bookstore/manage')
      return
    }

    await bookStore.ensureSeller()
    const created = await bookStore.uploadBook(formPayload)
    showSuccess(t('bookstore.save'))
    const nextId = created?._id || created?.id
    if (nextId) {
      router.push(`/bookstore/${nextId}`)
    } else {
      router.push('/bookstore/manage')
    }
  } catch (error) {
    showError(error?.response?.data?.message || error?.message || t('bookstore.saveFailed'))
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
    showError(t('bookstore.loadFailed'))
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
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4">
      <h1 class="page-title">{{ isEdit ? $t('bookstore.editBook') : $t('bookstore.uploadBook') }}</h1>
      <p class="page-subtitle">
        {{ isEdit ? $t('bookstore.updateBookDetails') : $t('bookstore.becomeSellerMsg') }}
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
  </BookstoreLayout>
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
