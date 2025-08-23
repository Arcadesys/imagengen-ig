import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const latest = await prisma.image.findMany({
      where: { url: { not: "" } },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, createdAt: true },
    })
    return NextResponse.json({ ok: true, count: latest.length, sample: latest })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Wall error" }, { status: 500 })
  }
}
