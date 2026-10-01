import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, API_ROUTES, request, register, login, getPosts, publishText, publishPost, uploadImage, authHeaders, interact, interactionAvailable, createInteractionClient } from '../src/api.js'
import { readPost, readTokenUser, readMedia, safeMediaUrl } from '../src/contract.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })
const user = { id: 'user-1' }
const tokenResponse = { access: 'header.' + Buffer.from(JSON.stringify({ user_id: user.id })).toString('base64url') + '.signature', refresh: 'test-refresh' }
const session = { user, accessToken: tokenResponse.access, refreshToken: 'test-refresh' }
const post = { id: 'post-1', authorId: 'user-1', title: 'A thought', body: 'Hello', mediaType: 'TEXT', caption: null, likes: [1, 2, 3], created_at: '2026-09-30T12:00:00Z' }

test('registration uses exact fields and excludes backend-only user fields', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/auth/register')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'omit')
    assert.deepEqual(JSON.parse(options.body), { email: 'a@example.com', displayName: 'Reader', password: 'test-password' })
    assert.equal(options.headers.Authorization, undefined)
    return json(tokenResponse, 201)
  }
  assert.deepEqual(await register({ email: 'a@example.com', displayName: 'Reader', password: 'test-password' }), session)
})

test('login uses email/password and returns only safe session fields', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/auth/login')
    assert.deepEqual(JSON.parse(options.body), { email: 'a@example.com', password: 'test-password' })
    return json(tokenResponse)
  }
  assert.deepEqual(await login({ email: 'a@example.com', password: 'test-password' }), session)
})

test('missing token pairs do not create a session', async () => {
  for (const value of [{}, { access: 'test' }, { refresh: 'test' }, { access: '', refresh: 'test' }]) {
    globalThis.fetch = async () => json(value)
    await assert.rejects(login({ email: 'a@example.com', password: 'test' }), /incomplete/)
  }
})

test('Bearer auth requires an access token', () => {
  assert.deepEqual(authHeaders(session), { Authorization: `Bearer ${tokenResponse.access}` })
  assert.throws(() => authHeaders(null), { status: 401 })
})

test('known errors do not require a guessed envelope', async () => {
  for (const response of [{ code: 'INVALID_CREDENTIALS' }, { error: { code: 'INVALID_CREDENTIALS' } }, 'INVALID_CREDENTIALS']) {
    globalThis.fetch = async () => json(response, 401)
    await assert.rejects(login({ email: 'a@example.com', password: 'test' }), { message: 'Invalid email or password.', status: 401 })
  }
})

test('unknown failures do not expose server internals or HTML', async () => {
  globalThis.fetch = async () => new Response('<html>private database internals</html>', { status: 500 })
  await assert.rejects(request('/api/posts'), (error) => error instanceof ApiError && error.status === 500 && !error.message.includes('private'))
})

test('204 response has no JSON body', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.equal(await request('/test-only'), null)
})

test('network and malformed success responses have readable errors', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed') }
  await assert.rejects(request('/api/posts'), /Unable to connect/)
  globalThis.fetch = async () => new Response('not json')
  await assert.rejects(request('/api/posts'), /unreadable response/)
})

test('every feed requires a session; DRF pagination maps to the UI', async () => {
  globalThis.fetch = async () => assert.fail('No anonymous network request')
  await assert.rejects(getPosts(), { status: 401 })
  const urls = []
  globalThis.fetch = async (url, options) => {
    urls.push(url)
    assert.equal(options.headers.Authorization, `Bearer ${tokenResponse.access}`)
    return json({ results: [post], count: 21, next: 'http://backend/api/posts?page=2', previous: null })
  }
  const data = await getPosts({ session })
  assert.equal(data.page, 1)
  assert.equal(data.hasMore, true)
  assert.equal(data.posts[0].likes, 3)
  await getPosts({ session, page: data.page + 1 })
  assert.deepEqual(urls, ['/api/posts', '/api/posts?page=2'])
})

test('authenticated and filtered feeds send Bearer auth and preserve filters on pagination', async () => {
  const urls = []
  globalThis.fetch = async (url, options) => {
    urls.push(url)
    assert.equal(options.headers.Authorization, `Bearer ${tokenResponse.access}`)
    return json({ results: [], count: 0, next: null, previous: null })
  }
  await getPosts({ session })
  await getPosts({ session, filter: 'following', page: 2 })
  await getPosts({ session, filter: 'liked', page: 2 })
  assert.deepEqual(urls, ['/api/posts', '/api/posts?page=2&onlyFollowing=true', '/api/posts?page=2&liked=true'])
})

test('personalized feed cannot silently fall back to anonymous requests', async () => {
  globalThis.fetch = async () => assert.fail('No network expected')
  await assert.rejects(getPosts({ filter: 'liked' }), { status: 401 })
  await assert.rejects(getPosts({ filter: 'following' }), { status: 401 })
})

test('valid empty feeds work; malformed envelopes and posts fail visibly', async () => {
  globalThis.fetch = async () => json({ results: [], count: 0, next: null, previous: null })
  assert.deepEqual((await getPosts({ session })).posts, [])
  globalThis.fetch = async () => json({ results: [] })
  await assert.rejects(getPosts({ session }), /incomplete/)
  globalThis.fetch = async () => json({ results: [{ id: 'missing-fields' }], count: 1, next: null, previous: null })
  await assert.rejects(getPosts({ session }), /unsupported post format/)
})

test('response adapters preserve clarified fields without backend-only data', () => {
  assert.deepEqual(readTokenUser(tokenResponse.access), user)
  assert.equal(readTokenUser('opaque-token'), null)
  assert.deepEqual(readPost({ ...post, unknown: 'ignored' }), { id: post.id, authorId: post.authorId, title: post.title, body: post.body, mediaType: post.mediaType, caption: '', likes: 3, createdAt: post.created_at, imageUrl: null })
  assert.throws(() => readPost({ post_id: '1', content: 'unknown' }))
  assert.equal(readPost({ ...post, mediaType: 'IMAGE', media_url: '/uploads/photo.png' }).imageUrl, '/uploads/photo.png')
})

test('media URLs reject unsafe schemes', () => {
  assert.equal(safeMediaUrl('javascript:alert(1)'), null)
  assert.equal(safeMediaUrl('data:text/html,test'), null)
  assert.equal(readMedia({ mediaId: 'unused', url: 'https://example.com/photo.png' }), 'https://example.com/photo.png')
  assert.equal(readMedia('/media/photo.png'), '/media/photo.png')
  assert.throws(() => readMedia({ mediaId: 'no-url' }))
})

test('text publishing is enabled and sends the exact payload with Bearer auth', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/posts')
    assert.equal(options.headers.Authorization, `Bearer ${tokenResponse.access}`)
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { title: 'Title', body: 'Body', mediaType: 'TEXT', caption: '' })
    return json(post, 201)
  }
  assert.equal((await publishText({ title: ' Title ', body: ' Body ' }, session)).id, post.id)
})

test('image upload uses multipart without manually setting its Content-Type boundary', async () => {
  const file = new File(['fixture-image'], 'image.png', { type: 'image/png' })
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/media')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, `Bearer ${tokenResponse.access}`)
    assert.equal(options.headers['Content-Type'], undefined)
    assert.ok(options.body instanceof FormData)
    assert.equal(options.body.get('file').name, 'image.png')
    assert.equal(options.body.get('mediaType'), 'IMAGE')
    return json({ mediaId: 'media-1', url: 'http://127.0.0.1:8000/media/image.png' }, 201)
  }
  assert.equal(await uploadImage(file, session), 'http://127.0.0.1:8000/media/image.png')
})

test('upload first then submit the image file to the post ImageField', async () => {
  const urls = []
  const file = new File(['bytes'], 'photo.png', { type: 'image/png' })
  globalThis.fetch = async (url, options) => {
    urls.push(url)
    if (url === '/api/media') return json({ mediaId: 1, url: 'http://backend/uploads/photo.png' }, 201)
    assert.ok(options.body instanceof FormData)
    assert.equal(options.headers['Content-Type'], undefined)
    assert.equal(options.headers.Authorization, `Bearer ${tokenResponse.access}`)
    assert.equal(options.body.get('media').name, 'photo.png')
    assert.equal(options.body.get('body'), '')
    assert.equal(options.body.get('mediaType'), 'IMAGE')
    assert.equal(options.body.get('caption'), 'A caption')
    return json({ ...post, mediaType: 'IMAGE', body: '', media: '/uploads/posts/photo.png', media_url: '/uploads/posts/photo.png' }, 201)
  }
  assert.equal(await uploadImage(file, session), 'http://backend/uploads/photo.png')
  const result = await publishPost({ title: 'Photo', image: file, caption: 'A caption' }, session)
  assert.equal(result.imageUrl, '/uploads/posts/photo.png')
  assert.deepEqual(urls, ['/api/media', '/api/posts'])
})

test('invalid uploads and drafts never reach the network', async () => {
  globalThis.fetch = async () => assert.fail('No network expected')
  await assert.rejects(uploadImage(new File(['text'], 'file.txt', { type: 'text/plain' }), session), { status: 400 })
  await assert.rejects(publishText({ title: ' ', body: 'Body' }, session), { status: 422 })
  await assert.rejects(publishPost({ title: 'Title' }, session), { status: 422 })
  await assert.rejects(publishPost({ title: 'Title', body: 'Body' }, null), { status: 401 })
})

test('malformed upload/publish responses are not claimed as success', async () => {
  globalThis.fetch = async () => json({ mediaId: 'id-only' }, 201)
  await assert.rejects(uploadImage(new File(['bytes'], 'photo.png', { type: 'image/png' }), session), /valid image URL/)
  globalThis.fetch = async () => json({ post: {} }, 201)
  await assert.rejects(publishText({ title: 'Title', body: 'Body' }, session), /Check the feed/)
})

test('confirmed interaction routes enable controls', () => {
  for (const action of ['like', 'unlike', 'follow', 'unfollow']) {
    assert.equal(API_ROUTES[action], `/api/${action}`)
    assert.equal(interactionAvailable(action), true)
  }
  assert.equal(interactionAvailable('comment'), false)
})

test('interaction transport uses body identifiers, Bearer auth, and correct methods', async () => {
  const routes = { like: '/api/like', unlike: '/api/unlike', follow: '/api/follow', unfollow: '/api/unfollow' }
  for (const action of Object.keys(routes)) {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, routes[action])
      assert.equal(url.includes('#'), false)
      assert.equal(options.headers.Authorization, `Bearer ${tokenResponse.access}`)
      assert.equal(options.headers['Content-Type'], 'application/json')
      assert.deepEqual(JSON.parse(options.body), action.includes('like') ? { postId: 'id-1' } : { authorId: 'id-1' })
      assert.equal(options.method, action.startsWith('un') ? 'DELETE' : 'POST')
      return action.startsWith('un') ? new Response(null, { status: 204 }) : json({ userId: 'user-1' }, 201)
    }
    await interact(action, 'id-1', session)
  }
})

test('invalid or unavailable interactions never reach the network', async () => {
  globalThis.fetch = async () => assert.fail('No network expected')
  await assert.rejects(createInteractionClient({})('like', 'post-1', session), /not available/)
  await assert.rejects(interact('comment', 'post-1', session), /not available/)
  for (const action of ['like', 'unlike', 'follow', 'unfollow']) {
    await assert.rejects(interact(action, '', session), /valid identifier/)
    await assert.rejects(interact(action, 'id-1', null), { status: 401 })
  }
})

test('401 status survives for session-expiry handling', async () => {
  globalThis.fetch = async () => json({ code: 'UNAUTHENTICATED' }, 401)
  await assert.rejects(publishText({ title: 'Title', body: 'Body' }, session), { status: 401 })
})

test('caller cancellation aborts underlying fetch', async () => {
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })
  const controller = new AbortController()
  const pending = request('/api/posts', { signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
})

 test('token-only login does not require profile fields or decodable claims', async () => {
  globalThis.fetch = async () => json({ access: 'opaque-token', refresh: 'refresh' })
  assert.deepEqual(await login({ email: 'A@EXAMPLE.COM', password: 'test' }), { user: null, accessToken: 'opaque-token', refreshToken: 'refresh' })
})

test('backend image failure is surfaced rather than claimed as publication', async () => {
  globalThis.fetch = async () => new Response('server traceback', { status: 500 })
  await assert.rejects(publishPost({ title: 'Image', image: new File(['bytes'], 'p.png', { type: 'image/png' }) }, session), { status: 500 })
})
