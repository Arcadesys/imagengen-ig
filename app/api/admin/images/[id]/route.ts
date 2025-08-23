import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { deleteImage } from "@/lib/images"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Delete a generated image and its paired base upload (if no other generated references remain)
// Also supports deleting a base image, removing all generated images that reference it.
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    const img = await (prisma as any).image.findUnique({ where: { id: id } })
    if (!img) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // If deleting a generated image, delete it and optionally the base if no other references remain
    if (img.kind === "GENERATED") {
      const baseId = img.baseImageId || null

      await deleteImage(id)

      if (baseId) {
        const remaining = await prisma.image.count({ where: { baseImageId: baseId } })
        if (remaining === 0) {
          try {
            await deleteImage(baseId)
          } catch (e) {
            console.warn("[Admin Images] Failed to delete base image", baseId, e)
          }
        }
      }

      return NextResponse.json({ success: true, deleted: { generated: 1, baseAlsoDeleted: !!baseId && (await prisma.image.findUnique({ where: { id: baseId } })) == null } })
    }

    // If deleting a base image, delete all generated images that reference it, then the base
    if (img.kind === "UPLOAD_BASE") {
      const generatedList = await prisma.image.findMany({ where: { baseImageId: id }, select: { id: true } })
      let deletedGenerated = 0

      for (const g of generatedList) {
        try {
          await deleteImage(g.id)
          deletedGenerated++
        } catch (e) {
          console.warn("[Admin Images] Failed to delete generated image", g.id, e)
        }
      }

      // Finally delete the base image
      await deleteImage(id)

      return NextResponse.json({ success: true, deleted: { base: 1, generated: deletedGenerated } })
    }

    // Fallback (unknown kind)
    await deleteImage(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[Admin Images] DELETE error", e)
    return NextResponse.json({ error: "Failed to delete images" }, { status: 500 })
  }
}
