import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"

// Helper to safely get params.slug for dynamic route handlers
async function getSlugParam(request: NextRequest, fallback?: string): Promise<string | undefined> {
  // Next.js requires awaiting params in some environments; parse from URL as a safe alternative
  try {
    const url = new URL(request.url)
    const parts = url.pathname.split("/").filter(Boolean)
    const slugIndex = parts.findIndex((p, i) => p === "generators" && parts[i + 1] !== undefined)
    if (slugIndex !== -1) return parts[slugIndex + 1]
  } catch {}
  return fallback
}

// GET one generator by slug (public)
export async function GET(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const generator = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!generator) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const cfg = (generator as any).config || null
    const schema = cfg?.schema || (cfg?.questions && cfg?.promptTemplate ? { title: generator.name, intro: generator.description, questions: cfg.questions, promptTemplate: cfg.promptTemplate, references: cfg.references } : null)
    return NextResponse.json({ generator, schema })
  } catch (error) {
    console.error("[generator GET]", error)
    return NextResponse.json({ error: "Failed to fetch generator" }, { status: 500 })
  }
}

// PATCH update (owner or admin)
export async function PATCH(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()

    // Fetch to verify ownership
    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isOwner = existing.createdById === session.user.id
    const isAdmin = isAdminRequest(request)
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await (prisma as any).imageGenerator.update({
      where: { slug },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        style: body.style ?? undefined,
        config: body.config ?? undefined,
        theme: body.theme ?? undefined,
        isActive: body.isActive ?? undefined,
        slug: body.slug ?? undefined,
      }
    })

    return NextResponse.json({ generator: updated })
  } catch (error) {
    console.error("[generator PATCH]", error)
    return NextResponse.json({ error: "Failed to update generator" }, { status: 500 })
  }
}

// DELETE generator (owner or admin)
export async function DELETE(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isOwner = existing.createdById === session.user.id
    const isAdmin = isAdminRequest(request)
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await (prisma as any).imageGenerator.delete({ where: { slug } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[generator DELETE]", error)
    return NextResponse.json({ error: "Failed to delete generator" }, { status: 500 })
  }
}

// GET generator theme by slug (public)
export async function GET_THEME(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Generator not found or inactive" }, { status: 404 })

    const generator = await (prisma as any).imageGenerator.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        theme: true,
      },
    })

    if (!generator || !generator.isActive) {
      return NextResponse.json({ error: "Generator not found or inactive" }, { status: 404 })
    }

    return NextResponse.json({ generator })
  } catch (error) {
    console.error("[generator GET_THEME]", error)
    return NextResponse.json({ error: "Failed to fetch generator" }, { status: 500 })
  }
}
