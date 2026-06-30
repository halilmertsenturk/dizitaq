import { Film } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Film className="h-4 w-4" />
            <span>Dizitaq — Discover movies & TV shows</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by Watchmode API</span>
            <span>Built with Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
