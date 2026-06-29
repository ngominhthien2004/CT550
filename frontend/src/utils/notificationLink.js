export function getNotificationLink(item) {
  if (item.type === 'follow' && item.actor?.username) {
    return `/users/${item.actor.username}`
  }
  if (['like', 'bookmark', 'comment'].includes(item.type) && item.artwork?._id) {
    return `/artworks/${item.artwork._id}`
  }
  if (item.type === 'request' && item.request?._id) {
    return `/requests/${item.request._id}`
  }
  if (item.type?.includes('_report')) {
    return '/admin'
  }
  if (item.type === 'system' && item.artwork?._id) {
    return `/artworks/${item.artwork._id}`
  }
  return '/notifications'
}
