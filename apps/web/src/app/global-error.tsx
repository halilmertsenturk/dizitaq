'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#a3a3a3', marginBottom: 32, lineHeight: 1.5 }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              background: '#e50914',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  )
}
