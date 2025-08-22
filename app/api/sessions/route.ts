import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST - Create a new generation session (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, generator, generatorSlug } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Session name is required" },
        { status: 400 }
      )
    }

    if (!generator && !generatorSlug) {
      return NextResponse.json(
        { error: "Generator or generatorSlug is required" },
        { status: 400 }
      )
    }

    // If a dynamic generator slug is provided, resolve it
    let generatorString = generator as string | undefined
    let generatorId: string | undefined

    if (generatorSlug) {
      const gen = await (prisma as any).imageGenerator.findUnique({ where: { slug: String(generatorSlug) } })
      if (!gen) {
        return NextResponse.json(
          { error: "Invalid generator slug" },
          { status: 400 }
        )
      }
      generatorString = gen.style || gen.slug
      generatorId = gen.id
    }

    // Accept legacy known strings as-is
    if (!generatorString) {
      generatorString = "custom"
    }

    const generationSession = await (prisma as any).generationSession.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        generator: generatorString,
        generatorId: generatorId ?? null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ session: generationSession })
  } catch (error) {
    console.error("Error creating generation session:", error)
    return NextResponse.json(
      { error: "Failed to create generation session" },
      { status: 500 }
    )
  }
}

// GET - List generation sessions (auth required)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const generator = url.searchParams.get("generator")
    const generatorSlug = url.searchParams.get("generatorSlug")
    const limit = parseInt(url.searchParams.get("limit") || "20")

    const whereClause: any = {
      createdById: session.user.id,
    }

    if (generator) whereClause.generator = generator

    if (generatorSlug) {
      const gen = await (prisma as any).imageGenerator.findUnique({ where: { slug: generatorSlug } })
      if (gen) whereClause.generatorId = gen.id
    }

    const generationSessions = await prisma.generationSession.findMany({
      where: whereClause,
      include: {
        images: {
          select: {
            id: true,
            url: true,
            kind: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            images: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: Math.min(limit, 100) // Cap at 100 sessions
    })

    return NextResponse.json({ sessions: generationSessions })
  } catch (error) {
    console.error("Error fetching generation sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch generation sessions" },
      { status: 500 }
    )
  }
}
