import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Quick session code creation for testing (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, maxGenerations } = body

    if (!code || typeof code !== "string" || code.length < 6 || code.length > 9) {
      return NextResponse.json(
        { error: "Code must be 6-9 characters long" },
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
        maxGenerations: maxGenerations || 10,
        // No createdById since this is for quick setup
      }
    })

    return NextResponse.json({ sessionCode })
  } catch (error) {
    console.error("Error creating quick session code:", error)
    return NextResponse.json(
      { error: "Failed to create session code" },
      { status: 500 }
    )
  }
}
