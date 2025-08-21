import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET - List all session codes (admin only)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionCodes = await prisma.sessionCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ sessionCodes })
  } catch (error) {
    console.error("Error fetching session codes:", error)
    return NextResponse.json(
      { error: "Failed to fetch session codes" },
      { status: 500 }
    )
  }
}

// POST - Create new session code (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, maxGenerations, expiresAt } = body

    if (!code || typeof code !== "string" || code.length < 6 || code.length > 9) {
      return NextResponse.json(
        { error: "Code must be 6-9 characters long" },
        { status: 400 }
      )
    }

    if (!maxGenerations || maxGenerations < 1) {
      return NextResponse.json(
        { error: "Max generations must be at least 1" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingCode = await prisma.sessionCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existingCode) {
      return NextResponse.json(
        { error: "Session code already exists" },
        { status: 409 }
      )
    }

    const sessionCode = await prisma.sessionCode.create({
      data: {
        code: code.toUpperCase(),
        name: name || null,
        maxGenerations,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ sessionCode })
  } catch (error) {
    console.error("Error creating session code:", error)
    return NextResponse.json(
      { error: "Failed to create session code" },
      { status: 500 }
    )
  }
}
