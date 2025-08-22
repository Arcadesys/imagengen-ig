import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { saveImage } from "../../../../lib/images"
import { prisma } from "../../../../lib/db"

let sharp: any = null
try {
  sharp = require("sharp")
} catch (e) {
  console.log("[v0] Sharp not available, using fallback image processing")
}

// Ensure this route runs on Node.js runtime (required for Prisma/Sharp)
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface UploadedImage {
  id: string
  url: string
  filename: string
  createdAt: string
}

export async function POST(request: NextRequest) {
  console.log("[v0] Upload API called")

  try {
    console.log("[v0] Parsing form data...")
    const formData = await request.formData()
    const file = formData.get("file") as File
    const sessionId = (formData.get("sessionId") as string) || undefined

    if (!file) {
      console.log("[v0] No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.type, file.size)

    // Validate file type (accept a broader set and convert when needed)
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/avif",
    ]
    if (!allowedTypes.includes(file.type)) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, JPG, WebP, HEIC/HEIF, and AVIF are allowed." },
        { status: 400 },
      )
    }

    // Validate file size
    const maxSize = Number(process.env.UPLOAD_MAX_SIZE_BYTES) || 10 * 1024 * 1024 // default 10MB
    const originalSize = file.size

    console.log("[v0] Preparing image buffer, original size:", originalSize)
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Convert unsupported/less optimal formats to webp early (HEIC/HEIF/AVIF)
    if (sharp) {
      try {
        const needsConversion = ["image/heic", "image/heif", "image/avif"].includes(file.type)
        if (needsConversion) {
          console.log("[v0] Converting", file.type, "to webp before size checks")
          const out = await sharp(buffer).rotate().webp({ quality: 90, effort: 4 }).toBuffer()
          buffer = Buffer.from(out)
        }
      } catch (e) {
        console.warn("[v0] Pre-conversion failed; proceeding with original buffer:", e)
      }
    }

    if (buffer.length > maxSize) {
      console.log("[v0] Image exceeds max size:", buffer.length, "max:", maxSize)

      if (sharp) {
        console.log("[v0] Attempting to compress with sharp...")
        try {
          const image = sharp(buffer).rotate()
          const meta = await image.metadata()
          let width = meta.width || 2048
          let quality = 80
          let attempts = 0
          let success = false

          while (attempts < 10) {
            const resized = sharp(buffer).rotate()
            const resizeNeeded = attempts >= 3 && width > 512
            const pipeline = resizeNeeded ? resized.resize({ width, withoutEnlargement: true }) : resized

            const out = await pipeline.webp({ quality, effort: 4 }).toBuffer()
            console.log(
              `[v0] Attempt ${attempts + 1}: width=${resizeNeeded ? width : meta.width} quality=${quality} -> ${out.length} bytes`,
            )
            if (out.length <= maxSize) {
              buffer = Buffer.from(out)
              success = true
              break
            }
            if (quality > 30) {
              quality -= 10
            } else {
              width = Math.max(512, Math.floor((width * 85) / 100))
            }
            attempts++
          }

          if (!success) {
            console.log("[v0] Unable to reduce image under limit after", attempts, "attempts")
            return NextResponse.json(
              { error: `File too large. Maximum size is ${Math.floor(maxSize / (1024 * 1024))}MB.` },
              { status: 400 },
            )
          }
        } catch (e) {
          console.error("[v0] Error during image compression:", e)
          return NextResponse.json({ error: "Failed to process image for upload" }, { status: 400 })
        }
      } else {
        // Fallback: reject large files when sharp is not available
        console.log("[v0] Sharp not available, rejecting large file")
        return NextResponse.json(
          {
            error: `File too large. Maximum size is ${Math.floor(maxSize / (1024 * 1024))}MB. Please resize your image before uploading.`,
          },
          { status: 400 },
        )
      }
    }

    console.log("[v0] Saving base image to DB and Supabase Storage")
    const saved = await saveImage({
      kind: "UPLOAD_BASE",
      mimeType: file.type || "image/png",
      buffer,
      originalName: (file?.name as string) || null,
      sessionId: sessionId || null,
    })

    console.log("[v0] Upload successful:", saved.id)

    return NextResponse.json({ baseImageId: saved.id, url: saved.url })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Query uploads from database instead of JSON file
    const uploads = await prisma.image.findMany({
      where: { kind: "UPLOAD_BASE" },
      select: {
        id: true,
        url: true,
        originalName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedUploads: UploadedImage[] = uploads.map(upload => ({
      id: upload.id,
      url: upload.url,
      filename: upload.originalName || "Unknown",
      createdAt: upload.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedUploads)
  } catch (error) {
    console.error("[v0] Error reading uploads:", error)
    return NextResponse.json({ error: "Failed to load uploads" }, { status: 500 })
  }
}
