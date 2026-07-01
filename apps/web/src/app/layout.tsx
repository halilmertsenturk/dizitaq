import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '@/styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dizitaq — Discover Movies & TV Shows',
  description: 'Discover where to watch your favorite movies and TV shows. Find streaming availability across Netflix, Disney+, Amazon Prime, and more.',
  keywords: ['movies', 'TV shows', 'streaming', 'Watchmode', 'Netflix', 'Disney+'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
