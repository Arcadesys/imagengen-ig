import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { isAdminRequest } from "@/lib/admin"

// Shape expected by the photobooth
// { title, intro?, questions: [{ id, text, placeholder?, type?, options?, allowCustom? }], references?, promptTemplate }

// Helper to safely get params.slug for dynamic route handlers
async function getSlugParam(request: NextRequest, fallback?: string): Promise<string | undefined> {
  try {
    const url = new URL(request.url)
    const parts = url.pathname.split("/").filter(Boolean)
    const slugIndex = parts.findIndex((p, i) => p === "generators" && parts[i + 1] !== undefined)
    if (slugIndex !== -1) return parts[slugIndex + 1]
  } catch {}
  return fallback
}

export async function GET(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const generator = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!generator) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const cfg = (generator as any).config || {}
    const schema = cfg.schema || (cfg.questions && cfg.promptTemplate
      ? { title: generator.name, intro: generator.description, questions: cfg.questions, references: cfg.references, promptTemplate: cfg.promptTemplate }
      : null)

    if (!schema) {
      return NextResponse.json({ error: "No questions configured for this generator" }, { status: 404 })
    }

    return NextResponse.json({ schema })
  } catch (error) {
    console.error("[generator/questions GET]", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    const session = await auth()
    const isAdmin = isAdminRequest(request)

    if (!session?.user?.id && !isAdmin) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { schema } = body || {}
    if (!schema || !schema.questions || !schema.promptTemplate) {
      return NextResponse.json({ error: "schema with questions and promptTemplate is required" }, { status: 400 })
    }

    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!existing) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const updated = await (prisma as any).imageGenerator.update({
      where: { slug },
      data: {
        // Prefer nested schema field to keep future extensibility
        config: {
          ...(existing as any).config,
          schema,
          questions: schema.questions, // also mirror for backwards compatibility
          promptTemplate: schema.promptTemplate,
          references: schema.references ?? null,
        },
      },
    })

    return NextResponse.json({ ok: true, generator: updated })
  } catch (error) {
    console.error("[generator/questions POST]", error)
    return NextResponse.json({ error: "Failed to save questions" }, { status: 500 })
  }
}
