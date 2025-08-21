import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// PATCH - Update session code (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isActive, maxGenerations, name, expiresAt } = body

    const sessionCode = await prisma.sessionCode.update({
      where: { id: params.id },
      data: {
        ...(typeof isActive === "boolean" && { isActive }),
        ...(maxGenerations && { maxGenerations }),
        ...(name !== undefined && { name }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ sessionCode })
  } catch (error) {
    console.error("Error updating session code:", error)
    return NextResponse.json(
      { error: "Failed to update session code" },
      { status: 500 }
    )
  }
}

// DELETE - Delete session code (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.sessionCode.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session code:", error)
    return NextResponse.json(
      { error: "Failed to delete session code" },
      { status: 500 }
    )
  }
}
