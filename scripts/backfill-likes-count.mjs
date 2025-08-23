#!/usr/bin/env node
// Backfill Image.likesCount from ImageLike rows
// Safe to run multiple times. Only updates rows where the value differs.

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function backfillLikesCount() {
  const BATCH = 500
  let offset = 0
  let updatedTotal = 0
  let processed = 0

  // Total images for progress
  const total = await prisma.image.count()
  console.log(`Starting likesCount backfill for ${total} images...`)

  while (true) {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: BATCH,
      select: {
        id: true,
        likesCount: true,
        _count: { select: { likes: true } },
      },
    })

    if (images.length === 0) break

    const updates = images
      .filter((img) => (img._count?.likes ?? 0) !== (img.likesCount ?? 0))
      .map((img) =>
        prisma.image.update({
          where: { id: img.id },
          data: { likesCount: img._count.likes },
        })
      )

    if (updates.length) {
      await prisma.$transaction(updates, { timeout: 60000 })
      updatedTotal += updates.length
    }

    processed += images.length
    offset += images.length
    const pct = ((processed / total) * 100).toFixed(1)
    console.log(`Processed ${processed}/${total} (${pct}%), updated ${updatedTotal}`)
  }

  console.log(`Done. Updated ${updatedTotal} image rows.`)
}

backfillLikesCount()
  .catch((e) => {
    console.error("Backfill failed:", e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
