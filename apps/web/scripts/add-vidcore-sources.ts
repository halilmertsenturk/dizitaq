import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const titles = await prisma.cachedTitle.findMany({
    where: { tmdbId: { not: null } },
    select: { watchmodeId: true, title: true, type: true, tmdbId: true },
  })

  console.log(`Found ${titles.length} titles with TMDB IDs\n`)

  let created = 0
  let skipped = 0

  for (const t of titles) {
    const embedUrl = t.type === 'movie'
      ? `https://vidcore.org/embed/movie/${t.tmdbId}?sub=tr`
      : `https://vidcore.org/embed/tv/${t.tmdbId}/{season}/{episode}?sub=tr`

    const existing = await prisma.videoSource.findFirst({
      where: { watchmodeId: t.watchmodeId, episodeId: null, sourceName: 'VidCore' },
    })

    if (existing) {
      console.log(`  SKIP  ${t.title} (${t.type}) — already exists`)
      skipped++
      continue
    }

    await prisma.videoSource.create({
      data: {
        watchmodeId: t.watchmodeId,
        embedUrl,
        sourceName: 'VidCore',
        language: 'tr',
      },
    })

    console.log(`  ADD   ${t.title} (${t.type}) — ${embedUrl}`)
    created++
  }

  console.log(`\nDone. ${created} added, ${skipped} skipped.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
