import { type NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

interface GalleryImage {
  id: string
  url: string
  prompt: string
  expandedPrompt?: string
  size: "512x512" | "768x768" | "1024x1024"
  seed?: string | number
  baseImageId?: string | null
  createdAt: string
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    const galleryFile = path.join(dataDir, "gallery.json")

    if (!existsSync(galleryFile)) {
      return NextResponse.json([])
    }

    const galleryData = await readFile(galleryFile, "utf-8")
    const gallery: GalleryImage[] = JSON.parse(galleryData)

    // Sort by creation date, newest first
    gallery.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(gallery)
  } catch (error) {
    console.error("Error reading gallery:", error)
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
  const body: GalleryImage = await request.json()

    // Validate required fields
  if (!body.id || !body.url || !body.prompt || !body.size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const dataDir = path.join(process.cwd(), "data")
    const galleryFile = path.join(dataDir, "gallery.json")

    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    // Read existing gallery
    let gallery: GalleryImage[] = []
    if (existsSync(galleryFile)) {
      const galleryData = await readFile(galleryFile, "utf-8")
      gallery = JSON.parse(galleryData)
    }

    // Add new image with timestamp
  const newImage: GalleryImage = {
      ...body,
      createdAt: new Date().toISOString(),
    }

    gallery.push(newImage)

    // Save updated gallery
    await writeFile(galleryFile, JSON.stringify(gallery, null, 2))

    return NextResponse.json(newImage)
  } catch (error) {
    console.error("Error saving to gallery:", error)
    return NextResponse.json({ error: "Failed to save to gallery" }, { status: 500 })
  }
}
