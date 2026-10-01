import { useEffect, useRef, useState } from 'react'
import { publishPost, uploadImage } from '../api.js'
import { useAuth } from '../auth/AuthContext.js'
import Notice from '../components/Notice.jsx'

export default function ComposeScreen({ onPublished, navigate, onExpired }) {
  const { session } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const activeRequest = useRef(null)
  const previewUrl = useRef('')
  const uploaded = useRef(null)
  const fileInput = useRef(null)
  const pending = Boolean(stage)

  useEffect(() => () => {
    activeRequest.current?.abort()
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
  }, [])

  function selectImage(file) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = ''
    uploaded.current = null
    setImage(null)
    setPreview('')
    setError('')
    if (!file) { if (fileInput.current) fileInput.current.value = ''; return }
    if (!file.type.startsWith('image/') || !file.size) {
      setError('Choose a valid image file.')
      if (fileInput.current) fileInput.current.value = ''
      return
    }
    previewUrl.current = URL.createObjectURL(file)
    setPreview(previewUrl.current)
    setImage(file)
  }

  async function submit(event) {
    event.preventDefault()
    if (activeRequest.current) return
    if (!title.trim() || (!body.trim() && !image)) {
      setError('Add a title and either text or an image.')
      return
    }
    const controller = new AbortController()
    activeRequest.current = controller
    setError('')
    try {
      let media = ''
      if (image) {
        if (uploaded.current?.file === image) media = uploaded.current.url
        else {
          setStage('Uploading image…')
          media = await uploadImage(image, session, controller.signal)
          if (controller.signal.aborted) return
          uploaded.current = { file: image, url: media }
        }
      }
      setStage('Publishing…')
      await publishPost({ title, body, image, caption: image ? caption : '' }, session, controller.signal)
      if (!controller.signal.aborted) onPublished()
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure.message)
        if (failure.status === 401) onExpired()
      }
    } finally {
      if (!controller.signal.aborted) setStage('')
      activeRequest.current = null
    }
  }

  return (
    <section className="compose-layout" aria-labelledby="compose-title">
      <button className="text-button back-link" onClick={() => navigate('feed')}>← Back to the feed</button>
      <p className="eyebrow">Add your perspective</p><h1 id="compose-title">What’s on your mind?</h1><p className="lead">A thought, a discovery, a story. Make it yours.</p>
      <form className="compose-panel" onSubmit={submit}>
        <fieldset disabled={pending}>
          <label>Title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Give your thought a headline" /></label>
          <label>Your post{image ? ' (optional)' : ''}<textarea name="body" value={body} onChange={(event) => setBody(event.target.value)} required={!image} rows={7} placeholder="Start writing here…" /></label>
          <label>Add an image (optional)<input ref={fileInput} type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} /></label>
          {image && <div className="image-preview"><img src={preview} alt="Your selected image" /><div><span>{image.name}</span><button className="text-button" type="button" onClick={() => selectImage(null)}>Remove image</button></div><label>Image caption (optional)<input value={caption} onChange={(event) => setCaption(event.target.value)} /></label></div>}
          <p className="field-help">Your post will be public. Drafts are discarded when you leave this screen.</p>
          {error && <Notice error>{error}</Notice>}
          {pending && <Notice>{stage}</Notice>}
          <div className="compose-actions"><button type="button" className="button secondary" onClick={() => navigate('feed')}>Cancel</button><button className="button" disabled={!title.trim() || (!body.trim() && !image)} type="submit">{pending ? stage : 'Publish post'} <span aria-hidden="true">↗</span></button></div>
        </fieldset>
      </form>
    </section>
  )
}
