import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/profile', '/watchlist'],
      },
    ],
    sitemap: 'https://dizitaq-web.vercel.app/sitemap.xml',
  }
}
