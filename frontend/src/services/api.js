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
export const getDiscovery = (params = {}) => api.get('/feed/discovery', { params })
export const getRankings = (params = {}) => api.get('/feed/rankings', { params })
export const getArtworks = (params = {}) => api.get('/artworks', { params })
export const getArtworkById = (artworkId) => api.get(`/artworks/${artworkId}`)
export const createArtwork = (formData) => api.post('/artworks', formData)
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
  follow: (userId) => api.post(`/users/${userId}/follow`),
  unfollow: (userId) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
  getFollowStatus: (userId) => api.get(`/users/${userId}/follow-status`),
}

export const adminApi = {
  getOverview: () => api.get('/users/admin/overview'),
  getUsers: (params = {}) => api.get('/users/admin/list', { params }),
  updateUser: (userId, payload) => api.patch(`/users/admin/${userId}`, payload),
  getArtworks: (params = {}) => api.get('/artworks/admin/list', { params }),
  deleteArtwork: (artworkId) => api.delete(`/artworks/${artworkId}`),
}

export const messageApi = {
  getMine: (params = {}) => api.get('/messages', { params }),
  create: (payload) => api.post('/messages', payload),
  markRead: (messageId) => api.patch(`/messages/${messageId}/read`),
}

export const notificationApi = {
  getMine: (params = {}) => api.get('/notifications', { params }),
  markRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
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

export default api
