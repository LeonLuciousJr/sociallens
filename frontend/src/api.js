import { readMedia, readPost, readTokenUser } from './contract.js'

export const API_ROUTES = Object.freeze({
  register: '/api/auth/register',
  login: '/api/auth/login',
  posts: '/api/posts',
  media: '/api/media',
  like: '/api/like',
  unlike: '/api/unlike',
  follow: '/api/follow',
  unfollow: '/api/unfollow',
})

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// The error envelope is not defined yet. Match documented codes/messages without
// assuming a particular property name, and never display arbitrary server HTML.
const errors = {
  EMAIL_ALREADY_REGISTERED: 'This email is already registered.',
  WEAK_PASSWORD: 'Password does not meet strength requirements.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TITLE_REQUIRED: 'Title must not be blank.',
  BODY_OR_MEDIA_REQUIRED: 'Either body or media must be provided.',
  INVALID_MEDIA: 'Media is invalid or unsupported.',
  MEDIA_REQUIRED: 'Choose an image to upload.',
  INVALID_MEDIA_TYPE: 'Choose a valid image file.',
  UNAUTHENTICATED: 'Please sign in to continue.',
}

function errorMessage(data, status) {
  const values = []
  function collect(value, depth = 0) {
    if (depth > 4) return
    if (typeof value === 'string') values.push(value)
    else if (value && typeof value === 'object') Object.values(value).forEach((v) => collect(v, depth + 1))
  }
  collect(data)
  for (const [code, message] of Object.entries(errors)) {
    if (values.includes(code) || values.includes(message)) return message
  }
  if (status === 401) return 'Your session is no longer valid. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'This service is not available yet. Please try again later.'
  if (status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (status >= 500) return 'SocialLens could not complete this request. Please try again.'
  return 'The request was not accepted. Check your entries and try again.'
}

export async function request(path, { method = 'GET', body, signal, headers = {} } = {}) {
  const multipart = body instanceof FormData
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 12000)
  try {
    const response = await fetch(path, {
      method,
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit', // Bearer authentication; never rely on ambient cookies.
      headers: { Accept: 'application/json', ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    })
    if (response.status === 204) return null
    const text = await response.text()
    let data
    try { data = text ? JSON.parse(text) : null } catch { data = null }
    if (!response.ok) throw new ApiError(errorMessage(data, response.status), response.status)
    if (data === null) throw new ApiError('SocialLens returned an unreadable response. Please try again.')
    return data
  } catch (error) {
    if (timedOut) throw new ApiError('The request timed out. Please try again.')
    if (error instanceof TypeError) throw new ApiError('Unable to connect to SocialLens. Check your connection and try again.')
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
  }
}

export function authHeaders(session) {
  if (!session?.accessToken) throw new ApiError('Please sign in to continue.', 401)
  return { Authorization: `Bearer ${session.accessToken}` }
}

function readSession(data) {
  if (typeof data?.access !== 'string' || !data.access
    || typeof data.refresh !== 'string' || !data.refresh) {
    throw new ApiError('The sign-in response was incomplete. Please try again.')
  }
  return { user: readTokenUser(data.access), accessToken: data.access, refreshToken: data.refresh }
}

export async function register({ email, displayName, password }, signal) {
  return readSession(await request(API_ROUTES.register, {
    method: 'POST', body: { email, displayName, password }, signal,
  }))
}

export async function login({ email, password }, signal) {
  return readSession(await request(API_ROUTES.login, {
    method: 'POST', body: { email: email.trim().toLowerCase(), password }, signal,
  }))
}

export async function getPosts({ page, filter = 'public', session, signal } = {}) {
  if (!['public', 'following', 'liked'].includes(filter)) throw new ApiError('Unknown feed filter.')
  const params = new URLSearchParams()
  if (page !== undefined) params.set('page', String(page))
  if (filter === 'following') params.set('onlyFollowing', 'true')
  if (filter === 'liked') params.set('liked', 'true')
  const query = params.size ? `?${params}` : ''
  // The merged backend requires authentication for every feed.
  const headers = authHeaders(session)
  const data = await request(`${API_ROUTES.posts}${query}`, { signal, headers })
  if (!Array.isArray(data?.results) || !Number.isInteger(data.count)
    || !(data.next === null || typeof data.next === 'string')) {
    throw new ApiError('The feed response was incomplete. Please try again.')
  }
  try {
    return { posts: data.results.map(readPost), page: page ?? 1, hasMore: data.next !== null }
  } catch {
    throw new ApiError('The feed contains an unsupported post format. Please try again later.')
  }
}

export async function uploadImage(file, session, signal) {
  const headers = authHeaders(session)
  if (!(file instanceof Blob) || !file.size || !file.type.startsWith('image/')) {
    throw new ApiError('Choose a valid image file.', 400)
  }
  const data = new FormData()
  data.append('file', file)
  data.append('mediaType', 'IMAGE')
  const result = await request(API_ROUTES.media, { method: 'POST', body: data, headers, signal })
  try { return readMedia(result) } catch {
    throw new ApiError('The upload response did not contain a valid image URL. Please try again.')
  }
}

export async function publishPost({ title, body = '', image = null, caption = '' }, session, signal) {
  const headers = authHeaders(session)
  if (!title.trim()) throw new ApiError(errors.TITLE_REQUIRED, 422)
  if (!body.trim() && !image) throw new ApiError('Write something or choose an image before publishing.', 422)
  let payload = { title: title.trim(), body: body.trim(), mediaType: 'TEXT', caption: caption.trim() }
  // ImageField accepts a file, not the URL returned by /api/media. Text omits media entirely.
  if (image) {
    if (!(image instanceof Blob) || !image.size || !image.type.startsWith('image/')) {
      throw new ApiError('Choose a valid image file.', 400)
    }
    payload = new FormData()
    payload.append('title', title.trim())
    payload.append('body', body.trim())
    payload.append('mediaType', 'IMAGE')
    payload.append('caption', caption.trim())
    payload.append('media', image)
  }
  const result = await request(API_ROUTES.posts, { method: 'POST', signal, headers, body: payload })
  try { return readPost(result) } catch {
    throw new ApiError('The publish response was incomplete. Check the feed before trying again.')
  }
}

export const publishText = (draft, session, signal) => publishPost({ title: draft.title, body: draft.body }, session, signal)

export function interactionAvailable(action) {
  return ['like', 'unlike', 'follow', 'unfollow'].includes(action) && typeof API_ROUTES[action] === 'string'
}

// Injectable route table is for isolated tests; the application uses API_ROUTES.
export function createInteractionClient(routes = API_ROUTES) {
  return async function interaction(action, id, session, signal) {
    const headers = authHeaders(session)
    if (!['like', 'unlike', 'follow', 'unfollow'].includes(action)
      || typeof routes[action] !== 'string' || !routes[action]) {
      throw new ApiError('This action is not available yet.')
    }
    if (typeof id !== 'string' || !id) throw new ApiError('This action needs a valid identifier.')
    const body = action === 'like' || action === 'unlike' ? { postId: id } : { authorId: id }
    return request(routes[action], {
      method: action === 'unlike' || action === 'unfollow' ? 'DELETE' : 'POST',
      body, signal, headers,
    })
  }
}

export const interact = createInteractionClient()
