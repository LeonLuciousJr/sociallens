import { useEffect, useRef, useState } from 'react'
import { login, register } from '../api.js'
import { useAuth } from '../auth/AuthContext.js'
import Notice from '../components/Notice.jsx'

export default function AuthScreen({ mode, navigate, onSuccess }) {
  const isRegister = mode === 'register'
  const { signIn } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(null)
  const formRef = useRef(null)
  useEffect(() => () => requestRef.current?.abort(), [])

  async function submit(event) {
    event.preventDefault()
    if (requestRef.current) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const email = String(fields.get('email')).trim()
    const password = String(fields.get('password'))
    const displayName = String(fields.get('displayName') || '').trim()
    if (isRegister && !displayName) { setError('Enter a display name.'); return }
    const controller = new AbortController()
    requestRef.current = controller
    setPending(true)
    setError('')
    try {
      const session = isRegister
        ? await register({ email, displayName, password }, controller.signal)
        : await login({ email, password }, controller.signal)
      if (controller.signal.aborted) return
      form.reset()
      signIn(session)
      onSuccess()
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure.message)
        formRef.current?.elements.namedItem('password')?.focus()
      }
    } finally {
      if (!controller.signal.aborted) setPending(false)
      requestRef.current = null
    }
  }

  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <div className="auth-intro">
        <p className="eyebrow">A place for your perspective</p>
        <h1 id="auth-title">{isRegister ? <>Good stories<br />start with you.</> : <>Welcome<br />back.</>}</h1>
        <p className="lead">{isRegister ? 'Make a little space for your ideas. Share a thought and discover something new.' : 'Pick up where you left off. Your next perspective is waiting.'}</p>
        <div className="decorative-frame" aria-hidden="true"><span>See it differently.</span><div className="lens-ring" /></div>
      </div>
      <div className="form-panel">
        <p className="eyebrow">{isRegister ? 'Create your account' : 'Your account'}</p>
        <h2>{isRegister ? 'Join SocialLens' : 'Log in to SocialLens'}</h2>
        <form onSubmit={submit} ref={formRef}>
          <fieldset disabled={pending}>
            {isRegister && <label>Display name<input name="displayName" autoComplete="nickname" required placeholder="How you’d like to be known" /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
            <label>Password<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required aria-describedby={isRegister ? 'password-help' : undefined} /></label>
            {isRegister && <p id="password-help" className="field-help">Use a strong, unique password. Your password will be checked when you submit.</p>}
            {error && <Notice error>{error}</Notice>}
            <button className="button full-width" type="submit">{pending ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}<span aria-hidden="true">↗</span></button>
          </fieldset>
        </form>
        <p className="form-switch">{isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button className="text-button" onClick={() => navigate(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button>
        </p>
        <p className="field-help">For now, reloading this page signs you out.</p>
      </div>
    </section>
  )
}
