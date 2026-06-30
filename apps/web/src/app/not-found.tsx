import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
