import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://dizitaq-web.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Dizitaq — Watch Free Movies & TV Shows',
    template: '%s | Dizitaq',
  },
  description: 'Watch free movies and TV shows online. Stream thousands of titles in HD with Turkish subtitles. No sign-up required.',
  keywords: ['film izle', 'dizi izle', 'movie streaming', 'TV shows', 'Turkish subtitles', 'free movies', 'HD streaming'],
  authors: [{ name: 'Dizitaq' }],
  creator: 'Dizitaq',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'Dizitaq',
    title: 'Dizitaq — Watch Free Movies & TV Shows',
    description: 'Watch free movies and TV shows online. Stream thousands of titles in HD with Turkish subtitles.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dizitaq — Watch Free Movies & TV Shows',
    description: 'Watch free movies and TV shows online. Stream thousands of titles in HD with Turkish subtitles.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
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
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  )
}
