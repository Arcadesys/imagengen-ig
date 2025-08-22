import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"

// Seed per-generator questions quickly (admin only)
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Admin secret required" }, { status: 401 })
    }

    const { schema } = await request.json()
    if (!schema) return NextResponse.json({ error: "schema is required" }, { status: 400 })

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
    if (!existing) return NextResponse.json({ error: "Generator not found" }, { status: 404 })

    const updated = await (prisma as any).imageGenerator.update({
      where: { slug: params.slug },
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
