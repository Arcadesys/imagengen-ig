import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Create a session bound to a generator slug
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const generator = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
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
