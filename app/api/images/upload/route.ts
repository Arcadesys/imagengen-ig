import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import sharp from "sharp"

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

  // Validate or prepare for resizing if file size exceeds max
  const maxSize = Number(process.env.UPLOAD_MAX_SIZE_BYTES) || 10 * 1024 * 1024 // default 10MB
  const originalSize = file.size

    console.log("[v0] Creating directories...")
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "base")
    const dataDir = path.join(process.cwd(), "data")

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

  console.log("[v0] Generating filename...")
  const originalExt = path.extname(file.name || "").toLowerCase()
    const baseImageId = crypto.randomUUID()
  let outputExt = originalExt || ".png"
  let filename = `${baseImageId}${outputExt}`
  let filepath = path.join(uploadDir, filename)

    console.log("[v0] Preparing image buffer, original size:", originalSize)
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Convert unsupported/less optimal formats to webp early (HEIC/HEIF/AVIF or unknown extension)
    try {
      const needsConversion = ["image/heic", "image/heif", "image/avif"].includes(file.type)
      if (needsConversion) {
        console.log("[v0] Converting", file.type, "to webp before size checks")
        const out = await sharp(buffer).rotate().webp({ quality: 90, effort: 4 }).toBuffer()
        buffer = Buffer.from(out)
        outputExt = ".webp"
        filename = `${baseImageId}${outputExt}`
        filepath = path.join(uploadDir, filename)
      }
    } catch (e) {
      console.warn("[v0] Pre-conversion failed; proceeding with original buffer:", e)
    }

    // If file exceeds max size, attempt to compress/resize
    if (buffer.length > maxSize) {
      console.log("[v0] Image exceeds max size, attempting to compress/resize...", buffer.length, "max:", maxSize)
      try {
        const image = sharp(buffer).rotate()
        const meta = await image.metadata()
        let width = meta.width || 2048
        let quality = 80
        let attempts = 0
        let success = false

  // Prefer webp for better compression when shrinking
  outputExt = ".webp"
  filename = `${baseImageId}${outputExt}`
  filepath = path.join(uploadDir, filename)

        while (attempts < 10) {
          const resized = sharp(buffer).rotate()
          // Reduce width gradually after a couple of quality attempts
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
          // Decrease quality first, then dimensions
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
    }

    console.log("[v0] Saving file to:", filepath)
    await writeFile(filepath, buffer)

    console.log("[v0] Updating uploads registry...")
    // Update uploads registry
    const uploadsFile = path.join(dataDir, "uploads.json")
    let uploads: UploadedImage[] = []

    if (existsSync(uploadsFile)) {
      const uploadsData = await readFile(uploadsFile, "utf-8")
      uploads = JSON.parse(uploadsData)
    }

    const uploadRecord: UploadedImage = {
      id: baseImageId,
  url: `/uploads/base/${filename}`,
      filename: file.name,
      createdAt: new Date().toISOString(),
    }

    uploads.push(uploadRecord)
    await writeFile(uploadsFile, JSON.stringify(uploads, null, 2))

    console.log("[v0] Upload successful:", baseImageId)

    // Best-effort: add to gallery as a base image so uploads appear there too.
    // Write directly to data/gallery.json; ignore errors to avoid blocking upload.
    try {
      const dataDir = path.join(process.cwd(), "data")
      const galleryFile = path.join(dataDir, "gallery.json")
      let gallery: Array<{
        id: string
        url: string
        prompt: string
        expandedPrompt?: string
        size: "512x512" | "768x768" | "1024x1024"
        seed?: string | number
        baseImageId?: string | null
        createdAt: string
      }> = []
      if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true })
      }
      if (existsSync(galleryFile)) {
        const s = await readFile(galleryFile, "utf-8")
        gallery = JSON.parse(s)
      }
      gallery.push({
        id: baseImageId,
        url: `/uploads/base/${filename}`,
        prompt: "Uploaded base image",
        size: "1024x1024",
        baseImageId,
        createdAt: new Date().toISOString(),
      })
      await writeFile(galleryFile, JSON.stringify(gallery, null, 2))
    } catch {}

    return NextResponse.json({ baseImageId, url: `/uploads/base/${filename}` })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    const uploadsFile = path.join(dataDir, "uploads.json")
    if (!existsSync(uploadsFile)) {
      return NextResponse.json([])
    }
    const uploadsData = await readFile(uploadsFile, "utf-8")
    const uploads: UploadedImage[] = JSON.parse(uploadsData)
    // Sort newest first
    uploads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json(uploads)
  } catch (error) {
    console.error("[v0] Error reading uploads:", error)
    return NextResponse.json({ error: "Failed to load uploads" }, { status: 500 })
  }
}
