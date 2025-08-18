import { type NextRequest, NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

interface GalleryImage {
  id: string
  url: string
  prompt: string
  size: "512x512" | "768x768" | "1024x1024"
  seed?: string | number
  baseImageId?: string | null
  createdAt: string
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const dataDir = path.join(process.cwd(), "data")
    const galleryFile = path.join(dataDir, "gallery.json")

    if (!existsSync(galleryFile)) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
    }

    // Read current gallery
    const galleryData = await readFile(galleryFile, "utf-8")
    const gallery: GalleryImage[] = JSON.parse(galleryData)

    // Find the image to delete
    const imageIndex = gallery.findIndex((img) => img.id === id)
    if (imageIndex === -1) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    const imageToDelete = gallery[imageIndex]

    // Remove from gallery array
    gallery.splice(imageIndex, 1)

    // Save updated gallery
    await writeFile(galleryFile, JSON.stringify(gallery, null, 2))

    // Optionally delete the actual file (for MVP, we'll keep files for safety)
    // const imagePath = path.join(process.cwd(), 'public', imageToDelete.url)
    // if (existsSync(imagePath)) {
    //   await unlink(imagePath)
    // }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
