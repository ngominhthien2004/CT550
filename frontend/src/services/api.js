import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

function deriveUploadsBaseUrl(apiBaseUrl) {
  if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
    return ''
  }

  try {
    return new URL(apiBaseUrl).origin
  } catch {
    return ''
  }
}

const UPLOADS_BASE_URL = (
  import.meta.env.VITE_UPLOADS_BASE_URL || deriveUploadsBaseUrl(API_BASE_URL)
).replace(/\/$/, '')

function normalizeBackendAssetUrl(value) {
  if (typeof value !== 'string') {
    return value
  }

  if (!value.startsWith('/uploads/') || !UPLOADS_BASE_URL) {
    return value
  }

  return `${UPLOADS_BASE_URL}${value}`
}

function normalizeResponseData(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeResponseData)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeResponseData(nestedValue)]),
    )
  }

  return normalizeBackendAssetUrl(value)
}

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use((response) => {
  response.data = normalizeResponseData(response.data)
  return response
})

export const getFeed = (params = {}) => api.get('/feed', { params })
export const getDiscovery = (params = {}) => api.get('/feed/discovery', { params })
export const getRankings = (params = {}) => api.get('/feed/rankings', { params })
export const getArtworks = (params = {}) => api.get('/artworks', { params })
export const getArtworkById = (artworkId) => api.get(`/artworks/${artworkId}`)
export const createArtwork = (formData) => api.post('/artworks', formData)
export const reportArtwork = (artworkId, payload) => api.post(`/artworks/${artworkId}/report`, payload)
export const getTags = (params = {}) => api.get('/tags', { params })
export const getTagDetail = (tagName) => api.get(`/tags/${encodeURIComponent(tagName)}`)

export const getComments = (params = {}) => api.get('/comments', { params })
export const getCommentReplies = (params = {}) => api.get('/comments/replies', { params })
export const createComment = (payload) => api.post('/comments', payload)
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`)

export const bookmarkApi = {
  getMine: (params = {}) => api.get('/bookmarks', { params }),
  create: (payload) => api.post('/bookmarks', payload),
  delete: (bookmarkId) => api.delete(`/bookmarks/${bookmarkId}`),
  getStatus: (artworkId) => api.get(`/bookmarks/status/${artworkId}`),
  toggle: (artworkId) => api.post('/bookmarks/toggle', { artworkId }),
}

export const likeApi = {
  getMine: (params = {}) => api.get('/likes', { params }),
  create: (payload) => api.post('/likes', payload),
  delete: (likeId) => api.delete(`/likes/${likeId}`),
  getStatus: (artworkId) => api.get(`/likes/status/${artworkId}`),
  toggle: (artworkId) => api.post('/likes/toggle', { artworkId }),
}

export const getMyBookmarks = (params = {}) => bookmarkApi.getMine(params)
export const createBookmark = (payload) => bookmarkApi.create(payload)
export const deleteBookmark = (bookmarkId) => bookmarkApi.delete(bookmarkId)

export const getMyLikes = (params = {}) => likeApi.getMine(params)
export const createLike = (payload) => likeApi.create(payload)
export const deleteLike = (likeId) => likeApi.delete(likeId)

export const userApi = {
  getProfile: (userId) => api.get(`/users/${userId}/profile`),
  updateProfile: (payload) => api.put('/users/profile', payload),
  deleteCover: () => api.delete('/users/profile/cover'),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  unfollow: (userId) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
  getFollowStatus: (userId) => api.get(`/users/${userId}/follow-status`),
  block: (userId) => api.post(`/users/${userId}/block`),
  unblock: (userId) => api.delete(`/users/${userId}/block`),
  getBlockedUsers: () => api.get('/users/blocked'),
  getBlockStatus: (userId) => api.get(`/users/${userId}/block-status`),
  searchPublic: (params = {}) => api.get('/users/search', { params }),
  postPresence: (userId, payload = {}) => api.post(`/users/${userId}/presence`, payload),
  getPresence: (userId) => api.get(`/users/${userId}/presence`),
}

export const adminApi = {
  getOverview: () => api.get('/users/admin/overview'),
  getUsers: (params = {}) => api.get('/users/admin/list', { params }),
  updateUser: (userId, payload) => api.patch(`/users/admin/${userId}`, payload),
  getArtworks: (params = {}) => api.get('/artworks/admin/list', { params }),
  deleteArtwork: (artworkId) => api.delete(`/artworks/${artworkId}`),

  // Comment moderation
  getComments: (params = {}) => api.get('/comments/admin/list', { params }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),

  // Report review
  getReportedRequests: (params = {}) => api.get('/requests/admin/reported', { params }),
  resolveReport: (requestId, payload) => api.post(`/requests/admin/${requestId}/resolve-report`, payload),

  // Tag management
  getTags: (params = {}) => api.get('/tags/admin/list', { params }),
  updateTag: (tagId, payload) => api.put(`/tags/admin/${tagId}`, payload),
  mergeTags: (payload) => api.post('/tags/admin/merge', payload),
  deleteTag: (tagId) => api.delete(`/tags/admin/${tagId}`),

  // AI settings
  getAiSettings: () => api.get('/users/admin/ai-settings'),
  updateAiSettings: (payload) => api.patch('/users/admin/ai-settings', payload),

  // Artwork moderation
  getReportedArtworks: (params = {}) => api.get('/artworks/admin/reported', { params }),
  resolveArtworkReport: (reportId, payload) => api.patch(`/artworks/admin/reports/${reportId}/resolve`, payload),
  getHiddenArtworks: (params = {}) => api.get('/artworks/admin/hidden', { params }),
  hideArtwork: (artworkId, payload) => api.patch(`/artworks/admin/${artworkId}/hide`, payload),
  unhideArtwork: (artworkId) => api.patch(`/artworks/admin/${artworkId}/unhide`),
}

export const messageApi = {
  getMine: (params = {}) => api.get('/messages', { params }),
  create: (payload) => api.post('/messages', payload),
  markRead: (messageId) => api.patch(`/messages/${messageId}/read`),
  searchThread: (threadId, q) => api.get(`/messages/${threadId}/search`, { params: { q } }),
  softDelete: (messageId) => api.patch(`/messages/${messageId}/delete`),
}

export const notificationApi = {
  getMine: (params = {}) => api.get('/notifications', { params }),
  markRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
}

export const requestApi = {
  getTerms: (params = {}) => api.get('/requests/terms', { params }),
  createTerm: (payload) => api.post('/requests/terms', payload),
  updateTerm: (termId, payload) => api.patch(`/requests/terms/${termId}`, payload),
  create: (formData) => api.post('/requests', formData),
  getMine: (params = {}) => api.get('/requests/mine', { params }),
  getPublic: (params = {}) => api.get('/requests/public', { params }),
  getById: (requestId) => api.get(`/requests/${requestId}`),
  accept: (requestId) => api.post(`/requests/${requestId}/accept`),
  reject: (requestId, payload = {}) => api.post(`/requests/${requestId}/reject`, payload),
  start: (requestId) => api.post(`/requests/${requestId}/start`),
  cancel: (requestId, payload = {}) => api.post(`/requests/${requestId}/cancel`, payload),
  submitDraft: (requestId, formData) => api.post(`/requests/${requestId}/draft`, formData),
  createRevision: (requestId, payload) => api.post(`/requests/${requestId}/revisions`, payload),
  complete: (requestId, formData) => api.post(`/requests/${requestId}/complete`, formData),
  approve: (requestId) => api.post(`/requests/${requestId}/approve`),
  getChat: (requestId) => api.get(`/requests/${requestId}/chat`),
  sendChat: (requestId, formData) => api.post(`/requests/${requestId}/chat`, formData),
  report: (requestId, payload) => api.post(`/requests/${requestId}/report`, payload),
}

export const registerAuthUser = (payload) => api.post('/auth/register', payload)
export const loginAuthUser = (payload) => api.post('/auth/login', payload)

export const getFollowers = (userId) => userApi.getFollowers(userId)
export const getFollowing = (userId) => userApi.getFollowing(userId)
export const getFollowStatus = (userId) => userApi.getFollowStatus(userId)
export const followUser = (userId) => userApi.follow(userId)
export const unfollowUser = (userId) => userApi.unfollow(userId)

export const getMyMessages = (params = {}) => messageApi.getMine(params)
export const createMessage = (payload) => messageApi.create(payload)
export const markMessageRead = (messageId) => messageApi.markRead(messageId)

export const getMyNotifications = (params = {}) => notificationApi.getMine(params)
export const markNotificationRead = (notificationId) => notificationApi.markRead(notificationId)

export const getRequestTerms = (params = {}) => requestApi.getTerms(params)
export const createRequestTerm = (payload) => requestApi.createTerm(payload)
export const createRequest = (formData) => requestApi.create(formData)
export const getMyRequests = (params = {}) => requestApi.getMine(params)

// Chapter APIs
export const getChapters = (artworkId) => api.get(`/artworks/${artworkId}/chapters`)
export const getChapter = (artworkId, chapterId) => api.get(`/artworks/${artworkId}/chapters/${chapterId}`)
export const createChapter = (artworkId, data) => api.post(`/artworks/${artworkId}/chapters`, data)
export const deleteChapter = (artworkId, chapterId) => api.delete(`/artworks/${artworkId}/chapters/${chapterId}`)

// Reading Progress APIs
export const getReadingProgress = (artworkId) => api.get(`/artworks/${artworkId}/reading-progress`)
export const saveReadingProgress = (artworkId, data) => api.post(`/artworks/${artworkId}/reading-progress`, data)

export default api
