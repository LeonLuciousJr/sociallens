// Keep serialization corrections here, separate from screen components.
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Decode only the identity hint used for "You" and self-follow visibility.
// This is not token verification or authorization; the backend verifies every request.
export function readTokenUser(token) {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
    return typeof claims.user_id === 'string' ? { id: claims.user_id } : null
  } catch { return null }
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
  const likes = Array.isArray(post?.likes) ? post.likes.length : post?.likes
  const createdAt = post?.created_at
  if (!isRecord(post) || typeof post.id !== 'string' || typeof post.authorId !== 'string'
    || typeof post.title !== 'string' || typeof post.body !== 'string'
    || !['TEXT', 'IMAGE'].includes(post.mediaType)
    || !Number.isInteger(likes) || likes < 0
    || typeof createdAt !== 'string'
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
    likes,
    createdAt,
    // Backend serializer exposes file URLs separately from the text body.
    imageUrl: post.mediaType === 'IMAGE' ? safeMediaUrl(post.media_url) || safeMediaUrl(post.media) : null,
  }
}

export function readMedia(data) {
  // Support the documented {url, mediaId} envelope and a returned JSON URL.
  const url = safeMediaUrl(typeof data === 'string' ? data : data?.url)
  if (!url) throw new Error('Unsupported media response')
  return url
}
