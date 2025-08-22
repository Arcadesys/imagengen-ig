import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Helper to safely get params.slug
async function getSlugParam(request: NextRequest, fallback?: string): Promise<string | undefined> {
  try {
    const url = new URL(request.url)
    const parts = url.pathname.split("/").filter(Boolean)
    const slugIndex = parts.findIndex((p, i) => p === "generator" && parts[i + 1] !== undefined)
    if (slugIndex !== -1) return parts[slugIndex + 1]
  } catch {}
  return fallback
}

// Create a session bound to a generator slug
export async function POST(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Generator not found or inactive" }, { status: 404 })

    const generator = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!generator || !generator.isActive) {
      return NextResponse.json({ error: "Generator not found or inactive" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const name = body?.name || `${generator.name} Session`
    const description = body?.description || null

    const generationSession = await (prisma as any).generationSession.create({
      data: {
        name,
        description,
        generator: generator.style || generator.slug,
        generatorId: generator.id,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ session: generationSession })
  } catch (error) {
    console.error("[sessions by generator POST]", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
