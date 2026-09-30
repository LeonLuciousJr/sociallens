export async function fetchHealth(signal) {
  const response = await fetch('/api/health/', {
    signal,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (response.status === 503) {
    throw new Error('Django is responding, but PostgreSQL is unavailable.')
  }
  if (!response.ok) {
    throw new Error(`The API returned HTTP ${response.status}. Check the backend terminal.`)
  }
  const data = await response.json()
  if (data.status !== 'ok' || data.database !== 'ok') {
    throw new Error('The API returned an unexpected health response.')
  }
  return data
}
