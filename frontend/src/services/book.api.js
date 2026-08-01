import axios from 'axios'

const multipartHeaders = { 'Content-Type': 'multipart/form-data' }

// Optional direct connection to the book-service. When `VITE_BOOK_SERVICE_URL`
// is set (production), we bypass the main-backend proxy and call the
// microservice directly. This avoids the 504 hangs the main-backend proxy
// can exhibit when forwarding POST /api/book-service/cart and similar
// protected endpoints.
const DIRECT_BOOK_SERVICE_URL = import.meta.env.VITE_BOOK_SERVICE_URL || ''

function attachAuthInterceptor(client) {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  return client
}

function buildDirectBookServiceClient() {
  const baseURL = `${DIRECT_BOOK_SERVICE_URL.replace(/\/$/, '')}/api/book-service`
  const client = axios.create({ baseURL })
  return attachAuthInterceptor(client)
}

// In local dev, the vite proxy forwards `/api/book-service/*` to the
// book-service microservice (port 5001). Using a dedicated axios instance
// with baseURL `/api/book-service` keeps the request paths identical to the
// direct (production) client, so call sites stay unchanged.
function buildLocalBookServiceClient() {
  const client = axios.create({ baseURL: '/api/book-service' })
  return attachAuthInterceptor(client)
}

const useDirectBookService = Boolean(DIRECT_BOOK_SERVICE_URL)
const bookServiceApi = useDirectBookService
  ? buildDirectBookServiceClient()
  : buildLocalBookServiceClient()

// ── Public books ───────────────────────────────────────────────────
export function getBooks(params = {}) {
  return bookServiceApi.get('/books', { params })
}

export function getBookById(bookId) {
  return bookServiceApi.get(`/books/${bookId}`)
}

// ── Protected books ────────────────────────────────────────────────
export function createBook(formData) {
  return bookServiceApi.post('/books', formData, { headers: multipartHeaders })
}

export function updateBook(bookId, formData) {
  return bookServiceApi.put(`/books/${bookId}`, formData, { headers: multipartHeaders })
}

export function deleteBook(bookId) {
  return bookServiceApi.delete(`/books/${bookId}`)
}

export function getMyBooks(params = {}) {
  return bookServiceApi.get('/books/my-books', { params })
}

// ── Cart ───────────────────────────────────────────────────────────
export function getCart() {
  return bookServiceApi.get('/cart')
}

export function addToCart(payload) {
  return bookServiceApi.post('/cart', payload)
}

export function updateCartItem(itemId, payload) {
  return bookServiceApi.put(`/cart/${itemId}`, payload)
}

export function removeCartItem(itemId) {
  return bookServiceApi.delete(`/cart/${itemId}`)
}

export function clearCart() {
  return bookServiceApi.delete('/cart')
}

// ── Orders ─────────────────────────────────────────────────────────
export function createOrder(payload) {
  return bookServiceApi.post('/orders', payload)
}

export function getMyOrders(params = {}) {
  return bookServiceApi.get('/orders', { params })
}

export function getOrderById(orderId) {
  return bookServiceApi.get(`/orders/${orderId}`)
}

export function getSellerOrders(params = {}) {
  return bookServiceApi.get('/orders/seller', { params })
}

export function cancelOrder(orderId) {
  return bookServiceApi.patch(`/orders/${orderId}/cancel`)
}

export function updateOrderStatus(orderId, payload) {
  return bookServiceApi.patch(`/orders/${orderId}/status`, payload)
}

export function downloadOrderItem(orderId, itemId) {
  return bookServiceApi.get(`/orders/${orderId}/download/${itemId}`, {
    responseType: 'blob',
  })
}

export function getDownloadUrl(orderId, itemId) {
  return bookServiceApi.get(`/orders/${orderId}/download/${itemId}`)
}

// ── Checkout ───────────────────────────────────────────────────────
export function createCheckoutSession(payload) {
  return bookServiceApi.post('/checkout', payload)
}

// ── Seller ───────────────────────────────────────────────────────────
export function becomeSeller() {
  return bookServiceApi.post('/seller/become')
}

export function getSellerProfile() {
  return bookServiceApi.get('/seller/profile')
}

export function updateSellerProfile(payload) {
  return bookServiceApi.put('/seller/profile', payload)
}

export function getPublicSellerProfile(sellerId) {
  return bookServiceApi.get(`/seller/public/${sellerId}`)
}

export function getSellerPublishedBooks(sellerId, params = {}) {
  return bookServiceApi.get(`/seller/public/${sellerId}/books`, { params })
}

export function getSellerDashboardStats(params = {}) {
  return bookServiceApi.get('/seller/dashboard/stats', { params })
}

// ── Reviews ────────────────────────────────────────────────────────
export function getBookReviews(bookId, params = {}) {
  return bookServiceApi.get(`/books/${bookId}/reviews`, { params })
}

export function createReview(bookId, payload) {
  return bookServiceApi.post(`/books/${bookId}/reviews`, payload)
}

export function updateReview(reviewId, payload) {
  return bookServiceApi.put(`/reviews/${reviewId}`, payload)
}

export function deleteReview(reviewId) {
  return bookServiceApi.delete(`/reviews/${reviewId}`)
}

// --- Related Books ---
export const bookApi = {
  getRelatedBooks(bookId, tags = []) {
    const tagStr = Array.isArray(tags) ? tags.join(',') : tags
    return bookServiceApi.get('/books/related', { params: { bookId, tags: tagStr } })
  },
}

// --- Book Bookmarks ---
export const bookBookmarkApi = {
  toggle: (bookId) => bookServiceApi.post('/book-bookmarks/toggle', { bookId }),
  getStatus: (bookId) => bookServiceApi.get(`/book-bookmarks/status/${bookId}`),
  getStatuses: (bookIds) => bookServiceApi.get('/book-bookmarks/status', { params: { ids: bookIds.join(',') } }),
  getMine: (params = {}) => bookServiceApi.get('/book-bookmarks', { params }),
  delete: (bookmarkId) => bookServiceApi.delete(`/book-bookmarks/${bookmarkId}`),
}

// Exposed for diagnostics / tests.
export { useDirectBookService, DIRECT_BOOK_SERVICE_URL }
