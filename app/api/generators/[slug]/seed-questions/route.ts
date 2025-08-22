import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"

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

// Seed per-generator questions quickly (admin only)
export async function POST(request: NextRequest, ctx: { params: { slug: string } }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Admin secret required" }, { status: 401 })
    }

    const { schema } = await request.json()
    if (!schema) return NextResponse.json({ error: "schema is required" }, { status: 400 })

    const slug = await getSlugParam(request, ctx?.params?.slug)
    if (!slug) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug } })
    if (!existing) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const updated = await (prisma as any).imageGenerator.update({
      where: { slug },
      data: {
        config: {
          ...(existing as any).config,
          schema,
          questions: schema.questions,
          promptTemplate: schema.promptTemplate,
          references: schema.references ?? null,
        },
      },
    })

    return NextResponse.json({ ok: true, generator: updated })
  } catch (error) {
    console.error("[seed-questions]", error)
    return NextResponse.json({ error: "Failed to seed questions" }, { status: 500 })
  }
}
