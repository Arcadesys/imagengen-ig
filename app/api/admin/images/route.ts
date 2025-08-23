import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// List recent image pairs (base + generated)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")
    const q = url.searchParams.get("q")?.toLowerCase()

    const where: any = { kind: "GENERATED", baseImageId: { not: null } }
    if (q) {
      where.OR = [
        { prompt: { contains: q, mode: "insensitive" } },
        { session: { name: { contains: q, mode: "insensitive" } } },
      ]
    }

    const generated = await (prisma as any).image.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: { id: true, url: true, createdAt: true, baseImageId: true, prompt: true, sessionId: true },
    })

    const baseIds = generated.map((g: any) => g.baseImageId).filter(Boolean)
    const bases = await prisma.image.findMany({ where: { id: { in: baseIds } }, select: { id: true, url: true } })
    const baseMap = new Map(bases.map((b) => [b.id, b.url]))

    const items = generated.map((g: any) => ({
      id: g.id,
      afterUrl: g.url,
      beforeUrl: baseMap.get(g.baseImageId!) || null,
      createdAt: g.createdAt.toISOString(),
      prompt: g.prompt || null,
    }))

    const total = await prisma.image.count({ where })

    return NextResponse.json({ items, total, hasMore: offset + items.length < total })
  } catch (e) {
    console.error("[Admin Images] GET error", e)
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 })
  }
}
