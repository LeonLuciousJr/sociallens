import { useEffect, useRef, useState } from 'react'
import { interact, interactionAvailable } from '../api.js'
import Notice from './Notice.jsx'

export default function PostCard({ post, session, filter, onChanged, onExpired }) {
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const activeRequest = useRef(null)
  useEffect(() => () => activeRequest.current?.abort(), [])
  const date = new Date(post.createdAt)
  const ownPost = session?.user?.id === post.authorId

  async function act(action) {
    if (activeRequest.current) return
    const controller = new AbortController()
    activeRequest.current = controller
    setPending(action)
    setError('')
    try {
      await interact(action, action === 'like' || action === 'unlike' ? post.id : post.authorId, session, controller.signal)
      if (!controller.signal.aborted) onChanged()
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure.message)
        if (failure.status === 401) onExpired()
      }
    } finally {
      if (!controller.signal.aborted) setPending('')
      activeRequest.current = null
    }
  }

  function actionButton(action, label) {
    const available = interactionAvailable(action)
    return <button type="button" className="interaction-button" disabled={Boolean(pending) || !available} title={available ? undefined : 'This action is not available yet.'} onClick={() => act(action)}>{pending === action ? 'Updating…' : label}</button>
  }

  return (
    <article className="post-card">
      <div className="post-label"><span className="post-marker" aria-hidden="true" /><span>{ownPost ? 'You' : `Author ${post.authorId}`}</span>{!Number.isNaN(date.getTime()) && <time dateTime={post.createdAt}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>}</div>
      <h2>{post.title}</h2>
      {post.mediaType === 'TEXT' ? <p className="post-body">{post.body}</p> : <figure className="post-image">{post.imageUrl && !imageFailed ? <img src={post.imageUrl} alt={post.caption || post.title} loading="lazy" onError={() => setImageFailed(true)} /> : <p className="muted">This image could not be displayed.</p>}{post.body && <p className="post-body">{post.body}</p>}{post.caption && <figcaption>{post.caption}</figcaption>}</figure>}
      <div className="post-actions"><span className="like-count">{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>{session && <>
        {filter !== 'liked' && actionButton('like', 'Like')}
        {actionButton('unlike', 'Unlike')}
        {!ownPost && <>{filter !== 'following' && actionButton('follow', 'Follow')}{actionButton('unfollow', 'Unfollow')}</>}
      </>}</div>
      {error && <Notice error>{error}</Notice>}
    </article>
  )
}
