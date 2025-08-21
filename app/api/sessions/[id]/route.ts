import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// DELETE - Delete a generation session (auth required)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const sessionId = params.id

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    // Verify the session belongs to the authenticated user
    const generationSession = await prisma.generationSession.findUnique({
      where: { id: sessionId },
      select: { createdById: true }
    })

    if (!generationSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    if (generationSession.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own sessions" },
        { status: 403 }
      )
    }

    // Delete the session (images will be unlinked but not deleted)
    await prisma.generationSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting generation session:", error)
    return NextResponse.json(
      { error: "Failed to delete generation session" },
      { status: 500 }
    )
  }
}
