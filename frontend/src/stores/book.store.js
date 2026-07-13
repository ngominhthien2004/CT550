import { defineStore } from 'pinia'
import {
  getBooks,
  getBookById,
  getBookCategories,
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
} from '../services/book.api.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

function buildBookFormData(payload) {
  const formData = new FormData()

  formData.append('title', payload.title?.trim() || '')
  formData.append('description', payload.description?.trim() || '')
  formData.append('price', Number(payload.price || 0))
  formData.append('originalPrice', Number(payload.originalPrice || payload.price || 0))
  formData.append('stock', Number.isFinite(payload.stock) ? payload.stock : -1)
  formData.append('status', payload.status || 'draft')

  const categories = Array.isArray(payload.categories) ? payload.categories : []
  categories.forEach((category) => formData.append('categories', category))

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
      category: '',
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
    categories: [],
    categoriesLoading: false,

    // Per-category book caches for Booth-style home sections
    categorySections: {},

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
    // Books grouped by category id (or category-name string) for Booth-style home sections
    booksByCategory: (state) => {
      const groups = new Map()
      for (const book of state.books || []) {
        const cats = Array.isArray(book.categories) ? book.categories : []
        for (const cat of cats) {
          const key = cat?._id || cat?.id || cat?.name || cat
          if (!key) continue
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key).push(book)
        }
      }
      return groups
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
  },

  actions: {
    setFilters(filters = {}) {
      this.filters = {
        ...this.filters,
        ...filters,
      }
      this.pagination.page = 1
    },

    async fetchCategories() {
      this.categoriesLoading = true
      try {
        const { data } = await getBookCategories()
        // The book-service returns either { data: [...] }, { value: [...] } (Azure-style),
        // or a bare array. Accept all of them so the store stays forward-compatible.
        const payload = data?.data ?? data?.value ?? data
        this.categories = Array.isArray(payload) ? payload : payload?.categories || []
      } catch (error) {
        this.categories = []
      } finally {
        this.categoriesLoading = false
      }
    },

    async fetchBooks(page = 1) {
      this.booksLoading = true
      this.booksError = ''

      try {
        const params = {
          page,
          limit: this.pagination.limit,
          search: this.filters.search || undefined,
          category: this.filters.category || undefined,
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

    // Fetch a small batch of published books for a single category.
    // Cached in `categorySections` so the home page can render multiple
    // category sections without refetching the same data.
    //
    // `categoryKey` may be the category's `_id`, slug, or name. The
    // book-service `listBooks` filter expects the category `_id`, so we
    // resolve slug/name → _id against the loaded `state.categories` first.
    async fetchBooksByCategory(categoryKey, { limit = 8 } = {}) {
      if (!categoryKey) return []

      const resolvedKey = this._resolveCategoryFilterId(categoryKey)

      this.categorySections = {
        ...this.categorySections,
        [categoryKey]: { loading: true, books: this.categorySections[categoryKey]?.books || [] },
      }

      try {
        const { data } = await getBooks({
          page: 1,
          limit,
          category: resolvedKey,
          sort: 'newest',
        })
        const list = data?.data ?? data?.books ?? []
        const books = Array.isArray(list) ? list : []
        this.categorySections = {
          ...this.categorySections,
          [categoryKey]: { loading: false, books },
        }
        return books
      } catch (error) {
        this.categorySections = {
          ...this.categorySections,
          [categoryKey]: { loading: false, books: this.categorySections[categoryKey]?.books || [] },
        }
        return []
      }
    },

    // Internal: turn any of {_id, slug, name} into the _id string the
    // book-service `listBooks` filter actually accepts. Falls back to the
    // original value when no match is found (and to undefined if blank).
    _resolveCategoryFilterId(categoryKey) {
      if (!categoryKey) return undefined
      const needle = String(categoryKey).toLowerCase()
      const hit = (this.categories || []).find(
        (cat) =>
          cat?._id === categoryKey ||
          cat?.id === categoryKey ||
          cat?.slug === categoryKey ||
          String(cat?.name || '').toLowerCase() === needle,
      )
      return hit?._id || hit?.id || categoryKey
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

    async checkout() {
      try {
        const { data } = await createCheckoutSession({})
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
        const list = data?.data ?? data?.orders ?? []
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
        const list = data?.data ?? data?.orders ?? []
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
        window.URL.revokeObjectURL(url)
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
  },
})
