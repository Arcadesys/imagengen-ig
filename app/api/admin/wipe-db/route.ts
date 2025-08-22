import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Danger: wipes non-auth data (images, sessions, generators, questionnaires, session codes)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Optional: lightweight confirmation guard
    const url = new URL(req.url)
    const confirm = url.searchParams.get("confirm")
    if (confirm !== "WIPE") {
      return NextResponse.json({ error: "Confirmation required. Append ?confirm=WIPE" }, { status: 400 })
    }

    // Delete in an order that respects FKs
    const deletedImages = await prisma.image.deleteMany({})
    const deletedSessions = await prisma.generationSession.deleteMany({})
    const deletedQuestionnaires = await (prisma as any).generatorQuestionnaire.deleteMany({})
    const deletedGenerators = await (prisma as any).imageGenerator.deleteMany({})
    const deletedSessionCodes = await prisma.sessionCode.deleteMany({})

    return NextResponse.json({
      ok: true,
      deleted: {
        images: deletedImages.count,
        sessions: deletedSessions.count,
        generators: deletedGenerators.count,
        questionnaires: deletedQuestionnaires.count,
        sessionCodes: deletedSessionCodes.count,
      },
    })
  } catch (error) {
    console.error("[admin/wipe-db]", error)
    return NextResponse.json({ error: "Failed to wipe database" }, { status: 500 })
  }
}
