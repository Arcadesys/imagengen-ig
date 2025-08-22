import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/db"
import { createErrorResponse, safeDatabaseOperation } from "../../../lib/error-handling"

// Ensure this route runs on Node.js runtime and never caches
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

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
    // Use safe database operation wrapper
    const images = await safeDatabaseOperation(async () => {
      return await prisma.image.findMany({
        select: {
          id: true,
          url: true,
          prompt: true,
          expandedPrompt: true,
          seed: true,
          baseImageId: true,
          createdAt: true,
          kind: true,
          width: true,
          height: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }, 'gallery-get')

    const gallery: GalleryImage[] = images.map(image => {
      // Determine size based on dimensions or default to 1024x1024
      let size: "512x512" | "768x768" | "1024x1024" = "1024x1024"
      if (image.width && image.height) {
        if (image.width <= 512 && image.height <= 512) {
          size = "512x512"
        } else if (image.width <= 768 && image.height <= 768) {
          size = "768x768"
        }
      }

      return {
        id: image.id,
        url: image.url,
        prompt: image.prompt || (image.kind === "UPLOAD_BASE" ? "Uploaded base image" : "Generated image"),
        expandedPrompt: image.expandedPrompt || undefined,
        size,
        seed: image.seed || undefined,
        baseImageId: image.baseImageId,
        createdAt: image.createdAt.toISOString(),
      }
    })

    return NextResponse.json(gallery)
  } catch (error: any) {
    const { response, statusCode } = createErrorResponse(error, 'gallery-get')
    return NextResponse.json(response, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Support two payload shapes:
    // 1) Single GalleryImage (legacy/test harness)
    // 2) { images: Array<{ id, url, metadata: { prompt, expandedPrompt?, size, seed?, baseImageId? } }> }
    
    // Since we're now using database-driven storage, we don't need to manually add to gallery
    // Images are automatically available via GET endpoint from database
    // This endpoint can be used for backwards compatibility but doesn't need to do anything
    
    if (Array.isArray(data?.images)) {
      const incoming = data.images as Array<{
        id: string
        url: string
        metadata?: {
          prompt: string
          expandedPrompt?: string
          size: "512x512" | "768x768" | "1024x1024"
          seed?: string | number
          baseImageId?: string | null
        }
      }>

      if (incoming.length === 0) {
        return NextResponse.json({ error: "No images provided" }, { status: 400 })
      }

      // Check if these images exist in the database
      const imageIds = incoming.map(img => img.id)
      const existingImages = await prisma.image.findMany({
        where: { id: { in: imageIds } },
        select: {
          id: true,
          url: true,
          prompt: true,
          expandedPrompt: true,
          seed: true,
          baseImageId: true,
          createdAt: true,
          width: true,
          height: true,
        }
      })

      const mapped: GalleryImage[] = existingImages.map(image => {
        let size: "512x512" | "768x768" | "1024x1024" = "1024x1024"
        if (image.width && image.height) {
          if (image.width <= 512 && image.height <= 512) {
            size = "512x512"
          } else if (image.width <= 768 && image.height <= 768) {
            size = "768x768"
          }
        }

        return {
          id: image.id,
          url: image.url,
          prompt: image.prompt || "Generated image",
          expandedPrompt: image.expandedPrompt || undefined,
          size,
          seed: image.seed || undefined,
          baseImageId: image.baseImageId,
          createdAt: image.createdAt.toISOString(),
        }
      })

      return NextResponse.json(mapped)
    } else {
      const body = data as Partial<GalleryImage>

      // Validate required fields
      if (!body.id || !body.url || !body.prompt || !body.size) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      // Check if image exists in database
      const image = await prisma.image.findUnique({
        where: { id: body.id },
        select: {
          id: true,
          url: true,
          prompt: true,
          expandedPrompt: true,
          seed: true,
          baseImageId: true,
          createdAt: true,
          width: true,
          height: true,
        }
      })

      if (!image) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 })
      }

      let size: "512x512" | "768x768" | "1024x1024" = "1024x1024"
      if (image.width && image.height) {
        if (image.width <= 512 && image.height <= 512) {
          size = "512x512"
        } else if (image.width <= 768 && image.height <= 768) {
          size = "768x768"
        }
      }

      const galleryImage: GalleryImage = {
        id: image.id,
        url: image.url,
        prompt: image.prompt || "Generated image",
        expandedPrompt: image.expandedPrompt || undefined,
        size,
        seed: image.seed || undefined,
        baseImageId: image.baseImageId,
        createdAt: image.createdAt.toISOString(),
      }

      return NextResponse.json(galleryImage)
    }
  } catch (error) {
    console.error("Error saving to gallery:", error)
    return NextResponse.json({ error: "Failed to save to gallery" }, { status: 500 })
  }
}
