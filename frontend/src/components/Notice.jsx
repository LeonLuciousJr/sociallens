export default function Notice({ children, error = false, onRetry }) {
  return (
    <div className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>
      <p>{children}</p>
      {onRetry && <button className="button secondary" onClick={onRetry}>Try again</button>}
    </div>
  )
}
