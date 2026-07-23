import { defineStore } from 'pinia'
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getMyBooks,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  downloadOrderItem,
  createCheckoutSession,
  becomeSeller,
  getSellerProfile,
  updateSellerProfile,
  getBookReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../services/book.api.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'
import { getCurrentUserIdFromToken } from '@/utils/jwt.js'

function buildBookFormData(payload) {
  const formData = new FormData()

  formData.append('title', payload.title?.trim() || '')
  formData.append('description', payload.description?.trim() || '')
  formData.append('price', Number(payload.price || 0))
  formData.append('originalPrice', Number(payload.originalPrice || payload.price || 0))
  formData.append('stock', Number.isFinite(payload.stock) ? payload.stock : -1)
  formData.append('status', payload.status || 'draft')

  const tags = Array.isArray(payload.tags) ? payload.tags : []
  tags.forEach((tag) => formData.append('tags', tag))

  if (payload.coverImage instanceof File) {
    formData.append('coverImage', payload.coverImage)
  }

  if (payload.ebookFile instanceof File) {
    formData.append('ebookFile', payload.ebookFile)
  }

  return formData
}

export const useBookStore = defineStore('book', {
  state: () => ({
    // Books list
    books: [],
    booksLoading: false,
    booksError: '',
    filters: {
      search: '',
      sort: 'newest',
      minPrice: '',
      maxPrice: '',
    },
    pagination: {
      page: 1,
      limit: 24,
      total: 0,
      pages: 1,
    },

    // Book detail
    currentBook: null,
    bookLoading: false,
    bookError: '',

    // Upload / manage
    uploadLoading: false,
    uploadProgress: 0,
    uploadError: '',
    uploadSuccess: false,
    myBooks: [],
    myBooksLoading: false,
    myBooksError: '',

    // Cart
    cart: null,
    cartItems: [],
    cartLoading: false,
    cartError: '',

    // Orders
    orders: [],
    ordersLoading: false,
    ordersError: '',
    sellerOrders: [],
    sellerOrdersLoading: false,
    sellerOrdersError: '',
    currentOrder: null,
    orderLoading: false,
    orderError: '',

    // Seller
    sellerProfile: null,
    sellerLoading: false,
    sellerError: '',
    isSeller: false,

    // Reviews
    reviews: [],
    reviewsLoading: false,
    reviewsError: '',
    reviewsPagination: { page: 1, limit: 10, total: 0, pages: 1 },
    reviewSubmitLoading: false,
    reviewSubmitError: '',
    userReview: null, // current user's review for this book (if any)
  }),

  getters: {
    cartTotal: (state) => {
      const items = state.cart?.items || state.cartItems || []
      return items.reduce((sum, item) => {
        const price = Number(item?.priceAtAdd || item?.book?.price || 0)
        const qty = Number(item?.quantity || 1)
        return sum + price * qty
      }, 0)
    },
    cartItemCount: (state) => {
      const items = state.cart?.items || state.cartItems || []
      return items.reduce((sum, item) => sum + Number(item?.quantity || 1), 0)
    },
    // Most-frequent tags from currently-loaded books (client-side aggregation)
    popularTags: (state) => {
      const counts = new Map()
      for (const book of state.books || []) {
        const tags = Array.isArray(book.tags) ? book.tags : []
        for (const tag of tags) {
          const value = typeof tag === 'string' ? tag : tag?.name || tag?._id
          if (!value) continue
          counts.set(value, (counts.get(value) || 0) + 1)
        }
      }
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 24)
        .map(([name, count]) => ({ name, count }))
    },
    // No additional getters needed for now
  },

  actions: {
    setFilters(filters = {}) {
      this.filters = {
        ...this.filters,
        ...filters,
      }
      this.pagination.page = 1
    },

    async fetchBooks(page = 1) {
      this.booksLoading = true
      this.booksError = ''

      try {
        const params = {
          page,
          limit: this.pagination.limit,
          search: this.filters.search || undefined,
          sort: this.filters.sort || 'newest',
          minPrice: this.filters.minPrice || undefined,
          maxPrice: this.filters.maxPrice || undefined,
        }

        const { data } = await getBooks(params)
        // The book-service returns { data: [...], pagination: {...} }.
        // Accept { books: [...] } as a fallback for forward-compat.
        const list = data?.data ?? data?.books ?? []
        this.books = Array.isArray(list) ? list : []
        this.pagination = {
          page: Number(data?.page || page),
          limit: Number(data?.limit || this.pagination.limit),
          total: Number(data?.total || 0),
          pages: Number(data?.pages || 1),
        }
      } catch (error) {
        this.booksError = getApiErrorMessage(error, 'Failed to load books')
        this.books = []
      } finally {
        this.booksLoading = false
      }
    },

    async fetchBookDetail(bookId) {
      this.bookLoading = true
      this.bookError = ''
      this.currentBook = null

      try {
        const { data } = await getBookById(bookId)
        this.currentBook = data
      } catch (error) {
        this.bookError = getApiErrorMessage(error, 'Failed to load book detail')
      } finally {
        this.bookLoading = false
      }
    },

    resetUploadState() {
      this.uploadLoading = false
      this.uploadProgress = 0
      this.uploadError = ''
      this.uploadSuccess = false
    },

    async uploadBook(payload) {
      this.uploadLoading = true
      this.uploadProgress = 0
      this.uploadError = ''
      this.uploadSuccess = false

      try {
        const formData = buildBookFormData(payload)
        const { data } = await createBook(formData)
        this.uploadSuccess = true
        return data
      } catch (error) {
        this.uploadError = getApiErrorMessage(error, 'Failed to upload book')
        throw error
      } finally {
        this.uploadLoading = false
      }
    },

    async updateBookById(bookId, payload) {
      this.uploadLoading = true
      this.uploadError = ''

      try {
        const formData = buildBookFormData(payload)
        const { data } = await updateBook(bookId, formData)
        return data
      } catch (error) {
        this.uploadError = getApiErrorMessage(error, 'Failed to update book')
        throw error
      } finally {
        this.uploadLoading = false
      }
    },

    async removeBook(bookId) {
      try {
        await deleteBook(bookId)
        this.myBooks = this.myBooks.filter((book) => book._id !== bookId)
      } catch (error) {
        throw error
      }
    },

    async fetchMyBooks(params = {}) {
      this.myBooksLoading = true
      this.myBooksError = ''

      try {
        const { data } = await getMyBooks(params)
        const list = data?.data ?? data?.books ?? []
        this.myBooks = Array.isArray(list) ? list : []
      } catch (error) {
        this.myBooksError = getApiErrorMessage(error, 'Failed to load your books')
        this.myBooks = []
      } finally {
        this.myBooksLoading = false
      }
    },

    async fetchCart() {
      this.cartLoading = true
      this.cartError = ''

      try {
        const { data } = await getCart()
        this.cart = data
        this.cartItems = data?.items || []
      } catch (error) {
        this.cartError = getApiErrorMessage(error, 'Failed to load cart')
      } finally {
        this.cartLoading = false
      }
    },

    async addBookToCart(bookId, quantity = 1) {
      try {
        const { data } = await addToCart({ bookId, quantity })
        this.cart = data
        this.cartItems = data?.items || []
      } catch (error) {
        throw error
      }
    },

    async updateCartItemQuantity(itemId, quantity) {
      try {
        const { data } = await updateCartItem(itemId, { quantity })
        this.cart = data
        this.cartItems = data?.items || []
      } catch (error) {
        throw error
      }
    },

    async removeFromCart(itemId) {
      try {
        const { data } = await removeCartItem(itemId)
        this.cart = data
        this.cartItems = data?.items || []
      } catch (error) {
        throw error
      }
    },

    async emptyCart() {
      try {
        await clearCart()
        this.cart = null
        this.cartItems = []
      } catch (error) {
        throw error
      }
    },

    async checkout(orderId) {
      try {
        const { data } = await createCheckoutSession({ orderId })
        return data?.url
      } catch (error) {
        throw error
      }
    },

    async placeOrder(payload) {
      try {
        const { data } = await createOrder(payload)
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchOrders(params = {}) {
      this.ordersLoading = true
      this.ordersError = ''

      try {
        const { data } = await getMyOrders(params)
        const list = Array.isArray(data) ? data : (data?.data ?? data?.orders ?? [])
        this.orders = Array.isArray(list) ? list : []
      } catch (error) {
        this.ordersError = getApiErrorMessage(error, 'Failed to load orders')
        this.orders = []
      } finally {
        this.ordersLoading = false
      }
    },

    async fetchOrderDetail(orderId) {
      this.orderLoading = true
      this.orderError = ''
      this.currentOrder = null

      try {
        const { data } = await getOrderById(orderId)
        this.currentOrder = data
      } catch (error) {
        this.orderError = getApiErrorMessage(error, 'Failed to load order')
      } finally {
        this.orderLoading = false
      }
    },

    async fetchSellerOrders(params = {}) {
      this.sellerOrdersLoading = true
      this.sellerOrdersError = ''

      try {
        const { data } = await getSellerOrders(params)
        const list = Array.isArray(data) ? data : (data?.data ?? data?.orders ?? [])
        this.sellerOrders = Array.isArray(list) ? list : []
      } catch (error) {
        this.sellerOrdersError = getApiErrorMessage(error, 'Failed to load seller orders')
        this.sellerOrders = []
      } finally {
        this.sellerOrdersLoading = false
      }
    },

    async updateSellerOrderStatus(orderId, status) {
      try {
        const { data } = await updateOrderStatus(orderId, { status })
        return data
      } catch (error) {
        throw error
      }
    },

    async downloadPaidBook(orderId, itemId) {
      try {
        const response = await downloadOrderItem(orderId, itemId)
        const blob = new Blob([response.data])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `book-${itemId}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        // Defer revoke: the browser reads the blob asynchronously after
        // click(). Revoking immediately can cancel the download for large
        // PDFs (intermittent failure). 1000ms is safe for Chrome/Firefox;
        // Safari may need longer.
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } catch (error) {
        throw error
      }
    },

    async fetchSellerProfile() {
      this.sellerLoading = true
      this.sellerError = ''

      try {
        const { data } = await getSellerProfile()
        this.sellerProfile = data
        this.isSeller = Boolean(data?.isSeller)
      } catch (error) {
        this.sellerProfile = null
        this.isSeller = false
        this.sellerError = getApiErrorMessage(error, 'Failed to load seller profile')
      } finally {
        this.sellerLoading = false
      }
    },

    async ensureSeller() {
      if (this.isSeller) {
        return this.sellerProfile
      }

      try {
        await becomeSeller()
        return await this.fetchSellerProfile()
      } catch (error) {
        this.sellerError = getApiErrorMessage(error, 'Failed to become a seller')
        throw error
      }
    },

    async saveSellerProfile(payload) {
      this.sellerLoading = true
      this.sellerError = ''

      try {
        const { data } = await updateSellerProfile(payload)
        this.sellerProfile = data
        this.isSeller = Boolean(data?.isSeller)
        return data
      } catch (error) {
        this.sellerError = getApiErrorMessage(error, 'Failed to update seller profile')
        throw error
      } finally {
        this.sellerLoading = false
      }
    },

    // ── Reviews ──────────────────────────────────────────────────────
    async fetchReviews(bookId, page = 1) {
      this.reviewsLoading = true
      this.reviewsError = ''

      try {
        const { data } = await getBookReviews(bookId, { page, limit: this.reviewsPagination.limit })
        this.reviews = data?.data ?? []
        this.reviewsPagination = data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 1 }

        // Check if current user has a review in the list
        const currentUserId = getCurrentUserIdFromToken()
        if (currentUserId) {
          const found = this.reviews.find(r => r.user?._id === currentUserId)
          this.userReview = found || null
        }
      } catch (error) {
        this.reviewsError = getApiErrorMessage(error, 'Failed to load reviews')
        this.reviews = []
      } finally {
        this.reviewsLoading = false
      }
    },

    async submitReview(bookId, payload) {
      this.reviewSubmitLoading = true
      this.reviewSubmitError = ''

      try {
        const { data } = await createReview(bookId, payload)
        // Prepend new review to list
        this.reviews.unshift(data)
        this.reviewsPagination.total += 1
        this.userReview = data
        // Recompute the book's aggregate rating locally so the header updates
        // without a second network round-trip.
        this._recomputeBookRating(bookId)
        return data
      } catch (error) {
        this.reviewSubmitError = getApiErrorMessage(error, 'Failed to submit review')
        throw error
      } finally {
        this.reviewSubmitLoading = false
      }
    },

    async updateUserReview(reviewId, payload) {
      this.reviewSubmitLoading = true
      this.reviewSubmitError = ''

      try {
        const { data } = await updateReview(reviewId, payload)
        // Update in list
        const idx = this.reviews.findIndex(r => r._id === reviewId)
        if (idx !== -1) {
          this.reviews[idx] = data
        }
        this.userReview = data
        // Keep the book's aggregate rating in sync with the local reviews list.
        const target = this.reviews.find(r => r._id === reviewId)
        if (target) this._recomputeBookRating(target.book)
        return data
      } catch (error) {
        this.reviewSubmitError = getApiErrorMessage(error, 'Failed to update review')
        throw error
      } finally {
        this.reviewSubmitLoading = false
      }
    },

    async removeReview(reviewId) {
      try {
        await deleteReview(reviewId)
        const target = this.reviews.find(r => r._id === reviewId)
        this.reviews = this.reviews.filter(r => r._id !== reviewId)
        this.reviewsPagination.total -= 1
        this.userReview = null
        if (target) this._recomputeBookRating(target.book)
      } catch (error) {
        throw error
      }
    },

    // Recompute the rating aggregate on the current book from the local
    // reviews list. Avoids a second network round-trip on every review CRUD.
    _recomputeBookRating(bookId) {
      if (!this.currentBook || String(this.currentBook._id) !== String(bookId)) return
      const ratings = this.reviews
        .map((r) => Number(r.rating))
        .filter((r) => Number.isFinite(r) && r > 0)
      if (ratings.length === 0) {
        this.currentBook.rating = 0
        this.currentBook.reviewCount = 0
        return
      }
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
      this.currentBook.rating = Math.round(avg * 10) / 10
      this.currentBook.reviewCount = ratings.length
    },
  },
})
