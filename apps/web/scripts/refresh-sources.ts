import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Delete broken sources (VidCore has no content)
  const delVidCore = await prisma.videoSource.deleteMany({ where: { sourceName: 'VidCore' } })
  console.log(`Deleted ${delVidCore.count} VidCore sources`)

  // 2. Get titles with TMDB IDs
  const titles = await prisma.cachedTitle.findMany({
    where: { tmdbId: { not: null } },
    select: { watchmodeId: true, title: true, type: true, tmdbId: true },
  })
  console.log(`Found ${titles.length} titles with TMDB IDs\n`)

  let added = 0

  for (const t of titles) {
    // VidLink (TMDB-based, uses JWPlayer, no frame blocking, no ads)
    const vidLinkUrl = t.type === 'movie'
      ? `https://vidlink.pro/movie/${t.tmdbId}`
      : `https://vidlink.pro/tv/${t.tmdbId}/{season}/{episode}`

    const existsVl = await prisma.videoSource.findFirst({
      where: { watchmodeId: t.watchmodeId, episodeId: null, sourceName: 'VidLink' },
    })
    if (!existsVl) {
      await prisma.videoSource.create({
        data: { watchmodeId: t.watchmodeId, embedUrl: vidLinkUrl, sourceName: 'VidLink', language: 'en' },
      })
      console.log(`  ADD VidLink — ${t.title} (${t.type})`)
      added++
    }

    // vidsrc.to (kullanılmıyor, sadece DB tutarlılığı için)
    // VidSrc Embed (kullanılmıyor, sadece DB tutarlılığı için)
  }

  console.log(`\nDone. ${added} new sources added.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
