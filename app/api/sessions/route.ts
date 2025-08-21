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
    const { name, description, generator } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Session name is required" },
        { status: 400 }
      )
    }

    if (!generator || typeof generator !== "string") {
      return NextResponse.json(
        { error: "Generator type is required" },
        { status: 400 }
      )
    }

    // Validate generator type
    const validGenerators = ["turn-toon", "puppetray", "photobooth", "generate"]
    if (!validGenerators.includes(generator)) {
      return NextResponse.json(
        { error: "Invalid generator type" },
        { status: 400 }
      )
    }

    const generationSession = await prisma.generationSession.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        generator,
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
    const limit = parseInt(url.searchParams.get("limit") || "20")

    const whereClause: any = {
      createdById: session.user.id,
    }

    if (generator) {
      whereClause.generator = generator
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
