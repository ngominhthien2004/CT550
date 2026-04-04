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

export const getComments = (params = {}) => api.get('/comments', { params })
export const createComment = (payload) => api.post('/comments', payload)
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`)

export const getMyBookmarks = (params = {}) => api.get('/bookmarks', { params })
export const createBookmark = (payload) => api.post('/bookmarks', payload)
export const deleteBookmark = (bookmarkId) => api.delete(`/bookmarks/${bookmarkId}`)

export default api
