// Keep serialization corrections here, separate from screen components.
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function readUser(user) {
  if (!isRecord(user) || typeof user.id !== 'string'
    || typeof user.displayName !== 'string' || typeof user.createdAt !== 'string') {
    throw new Error('Unsupported User representation')
  }
  // Deliberately exclude email, password hashes, and any backend-only fields.
  return { id: user.id, displayName: user.displayName, createdAt: user.createdAt }
}

export function safeMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value, 'http://sociallens.local')
    return ['http:', 'https:'].includes(url.protocol) ? value : null
  } catch {
    return null
  }
}

export function readPost(post) {
  if (!isRecord(post) || typeof post.id !== 'string' || typeof post.authorId !== 'string'
    || typeof post.title !== 'string' || typeof post.body !== 'string'
    || !['TEXT', 'IMAGE'].includes(post.mediaType)
    || !Number.isInteger(post.likes) || post.likes < 0
    || typeof post.createdAt !== 'string'
    || (post.caption != null && typeof post.caption !== 'string')) {
    throw new Error('Unsupported Post representation')
  }
  return {
    id: post.id,
    authorId: post.authorId,
    title: post.title,
    body: post.body,
    mediaType: post.mediaType,
    caption: post.caption ?? '',
    likes: post.likes,
    createdAt: post.createdAt,
    // Design classes specify that IMAGE body contains the image link.
    imageUrl: post.mediaType === 'IMAGE' ? safeMediaUrl(post.body) : null,
  }
}

export function readMedia(data) {
  // Support the documented {url, mediaId} envelope and a returned JSON URL.
  const url = safeMediaUrl(typeof data === 'string' ? data : data?.url)
  if (!url) throw new Error('Unsupported media response')
  return url
}
