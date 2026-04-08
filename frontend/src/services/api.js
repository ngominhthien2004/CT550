import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getFeed = (params = {}) => api.get('/feed', { params })
export const getRankings = (params = {}) => api.get('/feed/rankings', { params })
export const getArtworks = (params = {}) => api.get('/artworks', { params })
export const getArtworkById = (artworkId) => api.get(`/artworks/${artworkId}`)
export const createArtwork = (formData) => api.post('/artworks', formData)
export const getTags = (params = {}) => api.get('/tags', { params })
export const getTagDetail = (tagName) => api.get(`/tags/${encodeURIComponent(tagName)}`)

export const getComments = (params = {}) => api.get('/comments', { params })
export const createComment = (payload) => api.post('/comments', payload)
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`)

export const bookmarkApi = {
  getMine: (params = {}) => api.get('/bookmarks', { params }),
  create: (payload) => api.post('/bookmarks', payload),
  delete: (bookmarkId) => api.delete(`/bookmarks/${bookmarkId}`),
  getStatus: (artworkId) => api.get(`/bookmarks/status/${artworkId}`),
  toggle: (artworkId) => api.post('/bookmarks/toggle', { artworkId }),
}

export const getMyBookmarks = (params = {}) => bookmarkApi.getMine(params)
export const createBookmark = (payload) => bookmarkApi.create(payload)
export const deleteBookmark = (bookmarkId) => bookmarkApi.delete(bookmarkId)

export const registerAuthUser = (payload) => api.post('/auth/register', payload)
export const loginAuthUser = (payload) => api.post('/auth/login', payload)

export default api
