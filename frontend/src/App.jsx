import { useEffect, useState } from 'react'
import { fetchHealth } from './api.js'

const initialHealth = { state: 'loading', message: '', checkedAt: null }

export default function App() {
  const [attempt, setAttempt] = useState(0)
  const [health, setHealth] = useState(initialHealth)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort('timeout'), 8000)

    fetchHealth(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          setHealth({ state: 'success', message: '', checkedAt: new Date() })
        }
      })
      .catch((error) => {
        if (controller.signal.aborted && controller.signal.reason !== 'timeout') return
        const message = controller.signal.reason === 'timeout'
          ? 'The connection check timed out. Check the backend and try again.'
          : error instanceof TypeError
            ? 'Could not reach the API. Check the backend and try again.'
            : error.message
        setHealth({ state: 'error', message, checkedAt: new Date() })
      })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [attempt])

  function checkAgain() {
    setHealth(initialHealth)
    setAttempt((value) => value + 1)
  }

  const loading = health.state === 'loading'
  const title = loading ? 'Checking connection…'
    : health.state === 'success' ? 'All systems connected' : 'Connection needs attention'

  return (
    <main className="shell">
      <header>
        <a className="brand" href="/" aria-label="SocialLens home">
          <span className="brand-mark" aria-hidden="true">s</span>SocialLens
        </a>
        <span className="badge">CS 415 · Local foundation</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">The starting point</p>
        <h1 id="page-title">A foundation for<br />sharing perspectives.</h1>
        <p className="description">The SocialLens development environment is taking shape.
          Check the live connection before building the next feature.</p>
      </section>

      <section className="connection-card" aria-labelledby="connection-title">
        <div className="card-heading">
          <h2 id="connection-title">Environment check</h2>
          <span className="endpoint">GET /api/health/</span>
        </div>
        <div className={`status ${health.state}`} role="status" aria-live="polite" aria-atomic="true">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <h3>{title}</h3>
            <p>{loading ? 'Contacting the API and querying PostgreSQL.'
              : health.state === 'success'
                ? 'React received a successful response from Django and PostgreSQL.'
                : health.message}</p>
          </div>
        </div>
        <ol className="connection-path" aria-label="Connection path">
          <li><span>01</span><strong>React</strong><small>Browser interface</small></li>
          <li><span>02</span><strong>Django REST</strong><small>Application API</small></li>
          <li><span>03</span><strong>PostgreSQL</strong><small>Persistent database</small></li>
        </ol>
        <div className="card-footer">
          <p>{health.checkedAt ? `Last checked at ${health.checkedAt.toLocaleTimeString()}` : 'Live connection check'}</p>
          <button onClick={checkAgain} disabled={loading}>
            {loading ? 'Checking…' : 'Check again'}
          </button>
        </div>
      </section>

      <footer>Foundation preview · Accounts and social features are not available yet.</footer>
    </main>
  )
}
