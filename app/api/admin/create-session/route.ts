import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Create a generation session quickly (admin or any authenticated)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { name, description, generator, generatorSlug } = body || {}

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    let generatorString: string | null = generator || null
    let generatorId: string | null = null

    if (generatorSlug) {
      const gen = await (prisma as any).imageGenerator.findUnique({ where: { slug: String(generatorSlug) } })
      if (!gen) return NextResponse.json({ error: "generatorSlug not found" }, { status: 400 })
      generatorString = gen.style || gen.slug
      generatorId = gen.id
    }

    const created = await (prisma as any).generationSession.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        generator: generatorString || "custom",
        generatorId,
        createdById: session.user.id,
      }
    })

    return NextResponse.json({ session: created })
  } catch (e) {
    console.error("[admin/create-session]", e)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
