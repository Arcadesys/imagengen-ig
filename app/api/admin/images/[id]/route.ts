import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { deleteImage } from "@/lib/images"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Delete a generated image and its paired base upload (if no other generated references remain)
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    const generated = await (prisma as any).image.findUnique({ where: { id } })
    if (!generated || generated.kind !== "GENERATED") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const baseId = generated.baseImageId || null

    // Delete generated image (removes storage and DB)
    await deleteImage(id)

    // If base image exists and no other generated images reference it, delete the base too
    if (baseId) {
      const remaining = await prisma.image.count({ where: { baseImageId: baseId } })
      if (remaining === 0) {
        try {
          await deleteImage(baseId)
        } catch (e) {
          // log and continue
          console.warn("[Admin Images] Failed to delete base image", baseId, e)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[Admin Images] DELETE error", e)
    return NextResponse.json({ error: "Failed to delete images" }, { status: 500 })
  }
}
