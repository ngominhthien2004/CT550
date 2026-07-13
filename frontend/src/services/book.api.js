import api from './api.js'

const multipartHeaders = { 'Content-Type': 'multipart/form-data' }

// ── Public books ───────────────────────────────────────────────────
export function getBooks(params = {}) {
  return api.get('/book-service/books', { params })
}

export function getBookById(bookId) {
  return api.get(`/book-service/books/${bookId}`)
}

export function getBookCategories() {
  return api.get('/book-service/categories')
}

// ── Protected books ────────────────────────────────────────────────
export function createBook(formData) {
  return api.post('/book-service/books', formData, { headers: multipartHeaders })
}

export function updateBook(bookId, formData) {
  return api.put(`/book-service/books/${bookId}`, formData, { headers: multipartHeaders })
}

export function deleteBook(bookId) {
  return api.delete(`/book-service/books/${bookId}`)
}

export function getMyBooks(params = {}) {
  return api.get('/book-service/books/my-books', { params })
}

// ── Cart ───────────────────────────────────────────────────────────
export function getCart() {
  return api.get('/book-service/cart')
}

export function addToCart(payload) {
  return api.post('/book-service/cart', payload)
}

export function updateCartItem(itemId, payload) {
  return api.put(`/book-service/cart/${itemId}`, payload)
}

export function removeCartItem(itemId) {
  return api.delete(`/book-service/cart/${itemId}`)
}

export function clearCart() {
  return api.delete('/book-service/cart')
}

// ── Orders ─────────────────────────────────────────────────────────
export function createOrder(payload) {
  return api.post('/book-service/orders', payload)
}

export function getMyOrders(params = {}) {
  return api.get('/book-service/orders', { params })
}

export function getOrderById(orderId) {
  return api.get(`/book-service/orders/${orderId}`)
}

export function getSellerOrders(params = {}) {
  return api.get('/book-service/orders/seller', { params })
}

export function updateOrderStatus(orderId, payload) {
  return api.patch(`/book-service/orders/${orderId}/status`, payload)
}

export function downloadOrderItem(orderId, itemId) {
  return api.get(`/book-service/orders/${orderId}/download/${itemId}`, {
    responseType: 'blob',
  })
}

// ── Checkout ───────────────────────────────────────────────────────
export function createCheckoutSession(payload) {
  return api.post('/book-service/checkout', payload)
}

// ── Seller ───────────────────────────────────────────────────────────
export function becomeSeller() {
  return api.post('/book-service/seller/become')
}

export function getSellerProfile() {
  return api.get('/book-service/seller/profile')
}

export function updateSellerProfile(payload) {
  return api.put('/book-service/seller/profile', payload)
}
