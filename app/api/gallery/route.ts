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
    let gallery: GalleryImage[] = []
    try {
      gallery = JSON.parse(galleryData)
      if (!Array.isArray(gallery)) gallery = []
    } catch (e) {
      console.warn("[gallery] Invalid JSON in gallery.json, returning empty list:", e)
      gallery = []
    }

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
    const data = await request.json()

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
      try {
        gallery = JSON.parse(galleryData)
        if (!Array.isArray(gallery)) gallery = []
      } catch (e) {
        console.warn("[gallery] Invalid JSON in gallery.json, starting fresh:", e)
        gallery = []
      }
    }

    // Support two payload shapes:
    // 1) Single GalleryImage (legacy/test harness)
    // 2) { images: Array<{ id, url, metadata: { prompt, expandedPrompt?, size, seed?, baseImageId? } }> }
    if (Array.isArray(data?.images)) {
      const incoming = data.images as Array<
        {
          id: string
          url: string
          metadata?: {
            prompt: string
            expandedPrompt?: string
            size: "512x512" | "768x768" | "1024x1024"
            seed?: string | number
            baseImageId?: string | null
          }
        }
      >

      if (incoming.length === 0) {
        return NextResponse.json({ error: "No images provided" }, { status: 400 })
      }

      const now = new Date()
      const mapped: GalleryImage[] = incoming
        .filter((img) => img && img.id && img.url && img.metadata && img.metadata.prompt && img.metadata.size)
        .map((img, idx) => ({
          id: img.id,
          url: img.url,
          prompt: img.metadata!.expandedPrompt || img.metadata!.prompt,
          expandedPrompt: img.metadata!.expandedPrompt,
          size: img.metadata!.size,
          seed: img.metadata!.seed,
          baseImageId: img.metadata!.baseImageId ?? null,
          createdAt: new Date(now.getTime() + idx).toISOString(),
        }))

      if (mapped.length === 0) {
        return NextResponse.json({ error: "Invalid images payload" }, { status: 400 })
      }

      gallery.push(...mapped)
      await writeFile(galleryFile, JSON.stringify(gallery, null, 2))
      return NextResponse.json(mapped)
    } else {
      const body = data as Partial<GalleryImage>

      // Validate required fields
      if (!body.id || !body.url || !body.prompt || !body.size) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      // Add new image with timestamp
      const newImage: GalleryImage = {
        id: body.id,
        url: body.url,
        prompt: body.prompt,
        expandedPrompt: body.expandedPrompt,
        size: body.size,
        seed: body.seed,
        baseImageId: body.baseImageId ?? null,
        createdAt: new Date().toISOString(),
      }

      gallery.push(newImage)

      // Save updated gallery
      await writeFile(galleryFile, JSON.stringify(gallery, null, 2))

      return NextResponse.json(newImage)
    }
  } catch (error) {
    console.error("Error saving to gallery:", error)
    return NextResponse.json({ error: "Failed to save to gallery" }, { status: 500 })
  }
}
