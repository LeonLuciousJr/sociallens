// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from '../src/App.jsx'
import AuthScreen from '../src/screens/AuthScreen.jsx'
import FeedScreen from '../src/screens/FeedScreen.jsx'
import ComposeScreen from '../src/screens/ComposeScreen.jsx'
import PostCard from '../src/components/PostCard.jsx'
import { AuthContext } from '../src/auth/AuthContext.js'
import * as api from '../src/api.js'

vi.mock('../src/api.js', () => ({ login: vi.fn(), register: vi.fn(), getPosts: vi.fn(), publishPost: vi.fn(), uploadImage: vi.fn(), interact: vi.fn(), interactionAvailable: vi.fn(() => true) }))
const session = { user: { id: 'me' }, accessToken: 'fixture', refreshToken: 'fixture-refresh' }
const post = { id: 'p1', authorId: 'other', title: 'A perspective', body: 'A thoughtful post', mediaType: 'TEXT', likes: 1, createdAt: '2026-11-02T12:00:00Z', caption: '' }
const page = (posts = [], hasMore = false, number = 1) => ({ posts, hasMore, page: number })
const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
function withAuth(ui) { return render(<AuthContext.Provider value={{ session, signIn: vi.fn() }}>{ui}</AuthContext.Provider>) }
function change(label, value) { fireEvent.change(screen.getByLabelText(label), { target: { value } }) }
function submit() { fireEvent.submit(document.querySelector('form')) }
beforeEach(() => {
  vi.resetAllMocks()
  api.interactionAvailable.mockReturnValue(true)
  api.getPosts.mockResolvedValue(page())
  api.login.mockResolvedValue(session)
  api.register.mockResolvedValue(session)
  api.publishPost.mockResolvedValue(post)
  api.uploadImage.mockResolvedValue('/uploads/test.png')
  api.interact.mockResolvedValue(null)
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

test('registration validates display name, submits fields, and switches to login', async () => {
  const success = vi.fn(); const navigate = vi.fn()
  withAuth(<AuthScreen mode="register" onSuccess={success} navigate={navigate} />)
  change('Display name', '   '); submit()
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a display name')
  expect(api.register).not.toHaveBeenCalled()
  change('Display name', ' Reader '); change('Email address', 'reader@example.com'); change('Password', 'long-password'); submit()
  await waitFor(() => expect(success).toHaveBeenCalledOnce())
  expect(api.register).toHaveBeenCalledWith({ displayName: 'Reader', email: 'reader@example.com', password: 'long-password' }, expect.any(AbortSignal))
  fireEvent.click(screen.getByRole('button', { name: 'Log in' })); expect(navigate).toHaveBeenCalledWith('login')
})

test('login displays pending and errors without creating a session, then retries', async () => {
  const pending = deferred(); api.login.mockReturnValueOnce(pending.promise)
  const success = vi.fn(); const navigate = vi.fn()
  withAuth(<AuthScreen mode="login" onSuccess={success} navigate={navigate} />)
  change('Email address', 'reader@example.com'); change('Password', 'wrong'); submit(); submit()
  expect(api.login).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: /Please wait/ })).toBeDisabled()
  await act(async () => pending.reject(new Error('Invalid credentials')))
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  expect(success).not.toHaveBeenCalled()
  submit(); await waitFor(() => expect(success).toHaveBeenCalledOnce())
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' })); expect(navigate).toHaveBeenCalledWith('register')
})

test('unmount aborts authentication and ignores late completion', async () => {
  const pending = deferred(); api.login.mockReturnValue(pending.promise); const success = vi.fn()
  const view = withAuth(<AuthScreen mode="login" navigate={vi.fn()} onSuccess={success} />)
  submit(); const signal = api.login.mock.calls[0][1]; view.unmount()
  expect(signal.aborted).toBe(true)
  await act(async () => pending.resolve(session)); expect(success).not.toHaveBeenCalled()
})

test('signed-out feed prompts for login without requesting posts', async () => {
  const navigate = vi.fn(); render(<FeedScreen session={null} navigate={navigate} onExpired={vi.fn()} />)
  expect(screen.getByText('Sign in to browse posts')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Following' })); expect(navigate).toHaveBeenCalledWith('login')
  fireEvent.click(screen.getByRole('button', { name: /Make yourself/ })); expect(navigate).toHaveBeenCalledWith('register')
  expect(api.getPosts).not.toHaveBeenCalled()
})

test('feed shows loading, error, retry, empty states and compose action', async () => {
  const pending = deferred(); api.getPosts.mockReturnValueOnce(pending.promise)
  const navigate = vi.fn(); render(<FeedScreen session={session} navigate={navigate} onExpired={vi.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading posts')
  await act(async () => pending.reject(new Error('Unavailable')))
  expect(screen.getByRole('alert')).toHaveTextContent('Unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('A fresh page.')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Write the first post' })); expect(navigate).toHaveBeenCalledWith('compose')
  fireEvent.click(screen.getByRole('button', { name: 'Following' }))
  expect(await screen.findByText(/No posts from followed creators/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Liked posts' }))
  expect(await screen.findByText(/You haven’t liked/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Browse public posts' }))
  expect(await screen.findByText('A fresh page.')).toBeVisible()
})

test('pagination deduplicates posts and retries the failed page', async () => {
  api.getPosts.mockResolvedValueOnce(page([post], true)).mockRejectedValueOnce(new Error('Page failed')).mockResolvedValueOnce(page([post, { ...post, id: 'p2', title: 'Second' }], false, 2))
  render(<FeedScreen session={session} navigate={vi.fn()} onExpired={vi.fn()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Load more posts' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Page failed')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Second')).toBeVisible()
  expect(screen.getAllByText('A perspective')).toHaveLength(1)
  expect(api.getPosts.mock.calls[2][0].page).toBe(2)
  expect(screen.getByText('You’re all caught up.')).toBeVisible()
})

test('expired feed session invokes expiry handler', async () => {
  api.getPosts.mockRejectedValue(Object.assign(new Error('Expired'), { status: 401 }))
  const expired = vi.fn(); render(<FeedScreen session={session} navigate={vi.fn()} onExpired={expired} />)
  await waitFor(() => expect(expired).toHaveBeenCalledOnce())
})

test.each(['TEXT', 'IMAGE'])('%s posts expose other-author social controls and refresh after actions', async (mediaType) => {
  const changed = vi.fn(); const pending = deferred(); api.interact.mockReturnValueOnce(pending.promise)
  render(<PostCard post={{ ...post, mediaType, imageUrl: '/uploads/a.png', caption: 'A photo' }} session={session} filter="public" onChanged={changed} onExpired={vi.fn()} />)
  expect(screen.getByText('1 like')).toBeVisible()
  for (const name of ['Like', 'Unlike', 'Follow', 'Unfollow']) expect(screen.getByRole('button', { name, exact: true })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Follow', exact: true }))
  expect(api.interact).toHaveBeenCalledWith('follow', 'other', session, expect.any(AbortSignal))
  expect(screen.getByRole('button', { name: 'Like', exact: true })).toBeDisabled()
  await act(async () => pending.resolve(null)); expect(changed).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Unlike', exact: true }))
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(2))
  expect(api.interact.mock.calls[1][1]).toBe('p1')
})

test('post ownership, filter rules, missing session, and broken images are handled', () => {
  const props = { session, onChanged: vi.fn(), onExpired: vi.fn() }
  const view = render(<PostCard {...props} post={{ ...post, authorId: 'me' }} filter="liked" />)
  expect(screen.getByText('You')).toBeVisible(); expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Like', exact: true })).not.toBeInTheDocument()
  view.rerender(<PostCard {...props} post={{ ...post, mediaType: 'IMAGE', imageUrl: '/uploads/a.png', likes: 0, createdAt: 'invalid' }} filter="following" />)
  expect(screen.queryByRole('button', { name: 'Follow', exact: true })).not.toBeInTheDocument()
  fireEvent.error(screen.getByRole('img')); expect(screen.getByText('This image could not be displayed.')).toBeVisible()
  view.rerender(<PostCard {...props} session={null} post={post} filter="public" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('social-action failure shows error and expires unauthorized sessions', async () => {
  api.interact.mockRejectedValue(Object.assign(new Error('Expired'), { status: 401 }))
  const expired = vi.fn(); render(<PostCard post={post} session={session} onChanged={vi.fn()} onExpired={expired} />)
  fireEvent.click(screen.getByRole('button', { name: 'Like', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Expired'); expect(expired).toHaveBeenCalledOnce()
})

test('compose validates, publishes text, and supports cancel/back', async () => {
  const published = vi.fn(); const navigate = vi.fn()
  withAuth(<ComposeScreen onPublished={published} navigate={navigate} onExpired={vi.fn()} />)
  expect(screen.getByRole('button', { name: /Publish post/ })).toBeDisabled(); submit()
  expect(screen.getByRole('alert')).toHaveTextContent('Add a title')
  change('Title', 'Hello'); change('Your post', 'My words'); submit()
  await waitFor(() => expect(published).toHaveBeenCalledOnce())
  expect(api.publishPost.mock.calls[0][0]).toMatchObject({ title: 'Hello', body: 'My words', image: null })
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); fireEvent.click(screen.getByRole('button', { name: /Back to the feed/ }))
  expect(navigate).toHaveBeenCalledTimes(2)
})

test('image draft previews, uploads once across publish retries, and releases preview', async () => {
  api.publishPost.mockRejectedValueOnce(new Error('Retry publication'))
  const published = vi.fn(); const view = withAuth(<ComposeScreen onPublished={published} navigate={vi.fn()} onExpired={vi.fn()} />)
  const image = new File(['image'], 'photo.png', { type: 'image/png' })
  change('Title', 'Photo')
  fireEvent.change(screen.getByLabelText('Add an image (optional)'), { target: { files: [image] } })
  expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview')
  change('Image caption (optional)', 'Caption'); submit()
  expect(await screen.findByRole('alert')).toHaveTextContent('Retry publication')
  expect(screen.getByLabelText('Title')).toHaveValue('Photo')
  submit(); await waitFor(() => expect(published).toHaveBeenCalledOnce())
  expect(api.uploadImage).toHaveBeenCalledTimes(1)
  expect(api.publishPost.mock.calls[1][0]).toMatchObject({ image, caption: 'Caption' })
  fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
  expect(screen.queryByRole('img')).not.toBeInTheDocument(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  view.unmount()
})

test('invalid image and failed upload do not publish; unauthorized upload expires session', async () => {
  const expired = vi.fn(); withAuth(<ComposeScreen onPublished={vi.fn()} navigate={vi.fn()} onExpired={expired} />)
  const input = screen.getByLabelText('Add an image (optional)')
  fireEvent.change(input, { target: { files: [new File(['x'], 'x.txt', { type: 'text/plain' })] } })
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a valid image')
  change('Title', 'Photo'); fireEvent.change(input, { target: { files: [new File(['x'], 'x.png', { type: 'image/png' })] } })
  api.uploadImage.mockRejectedValue(Object.assign(new Error('Expired'), { status: 401 })); submit()
  await waitFor(() => expect(expired).toHaveBeenCalledOnce())
  expect(api.publishPost).not.toHaveBeenCalled()
})

test('full application navigates register, login, compose, publish and client logout', async () => {
  const user = userEvent.setup(); render(<App />)
  await user.click(screen.getByRole('button', { name: 'Join SocialLens' }))
  expect(screen.getByLabelText('Display name')).toBeVisible()
  await user.click(screen.getAllByRole('button', { name: 'Log in', exact: true })[0])
  change('Email address', 'reader@example.com'); change('Password', 'long-password'); submit()
  expect(await screen.findByText('A fresh page.')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Write the first post' }))
  change('Title', 'Hello'); change('Your post', 'Words'); submit()
  expect(await screen.findByText('Your post has been published.')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(screen.getByText('Sign in to browse posts')).toBeVisible()
  expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0)
})

test('application handles expired session and brand navigation', async () => {
  render(<App />); fireEvent.click(screen.getAllByRole('button', { name: 'Log in', exact: true })[0]); submit()
  await screen.findByText('A fresh page.')
  api.getPosts.mockRejectedValue(Object.assign(new Error('Expired'), { status: 401 }))
  fireEvent.click(screen.getByRole('button', { name: 'Following' }))
  expect(await screen.findByText('Your session ended. Please log in again.')).toBeVisible()
  fireEvent.click(screen.getByRole('link', { name: /SocialLens/ })); expect(screen.getByText('Sign in to browse posts')).toBeVisible()
})
