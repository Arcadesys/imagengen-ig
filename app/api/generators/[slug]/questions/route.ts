import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { isAdminRequest } from "@/lib/admin"

// Shape expected by the photobooth
// { title, intro?, questions: [{ id, text, placeholder?, type?, options?, allowCustom? }], references?, promptTemplate }

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const generator = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
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

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
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

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
    if (!existing) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const updated = await (prisma as any).imageGenerator.update({
      where: { slug: params.slug },
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
