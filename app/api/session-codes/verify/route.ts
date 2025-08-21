import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST - Verify session code and optionally use a generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, useGeneration = false } = body

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Session code is required" },
        { status: 400 }
      )
    }

    const sessionCode = await prisma.sessionCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!sessionCode) {
      return NextResponse.json(
        { error: "Invalid session code" },
        { status: 404 }
      )
    }

    if (!sessionCode.isActive) {
      return NextResponse.json(
        { error: "Session code is inactive" },
        { status: 403 }
      )
    }

    if (sessionCode.expiresAt && new Date(sessionCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Session code has expired" },
        { status: 403 }
      )
    }

    if (sessionCode.usedGenerations >= sessionCode.maxGenerations) {
      return NextResponse.json(
        { error: "Session code has reached its generation limit" },
        { status: 403 }
      )
    }

    // If this is a request to use a generation, increment the counter
    if (useGeneration) {
      const updatedSessionCode = await prisma.sessionCode.update({
        where: { id: sessionCode.id },
        data: {
          usedGenerations: sessionCode.usedGenerations + 1
        }
      })

      return NextResponse.json({
        valid: true,
        sessionCode: updatedSessionCode,
        remainingGenerations: updatedSessionCode.maxGenerations - updatedSessionCode.usedGenerations
      })
    }

    return NextResponse.json({
      valid: true,
      sessionCode,
      remainingGenerations: sessionCode.maxGenerations - sessionCode.usedGenerations
    })
  } catch (error) {
    console.error("Error verifying session code:", error)
    return NextResponse.json(
      { error: "Failed to verify session code" },
      { status: 500 }
    )
  }
}
