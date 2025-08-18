import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

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

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "Invalid file type. Only PNG, JPEG, and WebP are allowed." }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

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
    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const baseImageId = uuidv4()
    const filename = `${baseImageId}${fileExtension}`
    const filepath = path.join(uploadDir, filename)

    console.log("[v0] Saving file to:", filepath)
    // Save file
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

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
    return NextResponse.json({
      baseImageId,
      url: `/uploads/base/${filename}`,
    })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
