/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.watchmode.com' },
      { protocol: 'https', hostname: 'img.watchmode.com' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
    ],
  },
}

export default nextConfig
