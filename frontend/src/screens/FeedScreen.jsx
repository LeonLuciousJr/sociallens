import { useEffect, useRef, useState } from 'react'
import { getPosts, interactionAvailable } from '../api.js'
import Notice from '../components/Notice.jsx'
import PostCard from '../components/PostCard.jsx'

const labels = { public: 'Public', following: 'Following', liked: 'Liked posts' }
const emptyMessages = {
  public: 'No posts here yet. Be the first to share a perspective.',
  following: 'No posts from followed creators yet. Discover people in the public feed.',
  liked: 'You haven’t liked any posts yet.',
}

function FeedResults({ filter, session, navigate, onExpired, showPublic }) {
  const [feed, setFeed] = useState({ posts: [], page: null, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const activeRequest = useRef(null)
  const nextPage = useRef(undefined)

  async function load(page) {
    if (activeRequest.current) return
    const controller = new AbortController()
    activeRequest.current = controller
    nextPage.current = page
    setLoading(true)
    setError('')
    try {
      const data = await getPosts({ page, filter, session, signal: controller.signal })
      if (controller.signal.aborted) return
      setFeed((previous) => {
        const posts = page === undefined ? data.posts : [...previous.posts, ...data.posts]
        return { ...data, posts: [...new Map(posts.map((post) => [post.id, post])).values()] }
      })
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure.message)
        if (failure.status === 401 && session) onExpired()
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    activeRequest.current = controller
    getPosts({ filter, session, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setFeed(data)
    }).catch((failure) => {
      if (!controller.signal.aborted) {
        setError(failure.message)
        if (failure.status === 401 && session) onExpired()
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    })
    return () => { controller.abort(); activeRequest.current?.abort(); activeRequest.current = null }
  }, [filter, session, onExpired])

  return <>
    {error && <Notice error onRetry={() => load(nextPage.current)}>{error}</Notice>}
    {!error && !loading && feed.posts.length === 0 && <div className="empty-state"><span className="empty-symbol" aria-hidden="true">✳</span><h2>{filter === 'public' ? 'A fresh page.' : 'Nothing here yet.'}</h2><p>{emptyMessages[filter]}</p><button className="button" onClick={filter === 'public' ? () => navigate(session ? 'compose' : 'register') : showPublic}>{filter !== 'public' ? 'Browse public posts' : session ? 'Write the first post' : 'Join SocialLens'}</button></div>}
    <div className="posts">{feed.posts.map((post) => <PostCard key={post.id} post={post} session={session} filter={filter} onChanged={() => load(undefined)} onExpired={onExpired} />)}</div>
    {loading && <Notice>Loading posts…</Notice>}
    {!loading && !error && feed.hasMore && <button className="button secondary load-more" onClick={() => load(feed.page + 1)}>Load more posts</button>}
    {!loading && !error && feed.posts.length > 0 && !feed.hasMore && <p className="feed-end">You’re all caught up.</p>}
  </>
}

export default function FeedScreen({ session, navigate, onExpired }) {
  const [selectedFilter, setSelectedFilter] = useState('public')
  const filter = session ? selectedFilter : 'public'
  const interactionsPending = ['like', 'unlike', 'follow', 'unfollow'].some((action) => !interactionAvailable(action))

  return (
    <div className="feed-layout">
      <section className="feed-column" aria-labelledby="feed-title">
        <div className="feed-intro"><p className="eyebrow">{labels[filter]} feed</p><h1 id="feed-title">Different lives.<br /><span>Fresh perspectives.</span></h1><p className="lead">A shared space for everyday discoveries and ideas worth sharing.</p></div>
        <div className="feed-toolbar"><div className="feed-filters" role="group" aria-label="Feed filters">{Object.entries(labels).map(([value, label]) => <button key={value} className={`filter-button ${filter === value ? 'selected' : ''}`} aria-pressed={filter === value} onClick={() => value !== 'public' && !session ? navigate('login') : setSelectedFilter(value)}>{label}</button>)}</div></div>
        {session && interactionsPending && <p className="field-help">Some like and follow actions are not available yet. You can still browse your feeds.</p>}
        <FeedResults key={`${filter}:${session?.user.id ?? 'visitor'}`} filter={filter} session={session} navigate={navigate} onExpired={onExpired} showPublic={() => setSelectedFilter('public')} />
      </section>
      <aside className="feed-sidebar">
        <div className="sidebar-art" aria-hidden="true"><div className="lens-ring" /><span>A little<br />perspective.</span></div>
        <div className="sidebar-copy"><p className="eyebrow">Your corner of the internet</p><h2>Something on<br /> your mind?</h2><p>Big ideas. Small observations. There’s room for both.</p><button className="button full-width" onClick={() => navigate(session ? 'compose' : 'register')}>{session ? 'Write a post' : 'Make yourself at home'} <span aria-hidden="true">↗</span></button></div>
        {session && <p className="signed-in">Signed in as <strong>{session.user.displayName}</strong></p>}
      </aside>
    </div>
  )
}
