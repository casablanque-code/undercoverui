const STORAGE_KEY = 'uui_likes'

export function getLikes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function isLiked(id) {
  return !!getLikes()[id]
}

export function toggleLike(id) {
  const likes = getLikes()
  likes[id] = !likes[id]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(likes))
  return likes[id]
}
