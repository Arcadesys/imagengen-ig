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
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PNG, JPEG, and WebP are allowed." }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "base")
    const dataDir = path.join(process.cwd(), "data")

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const baseImageId = uuidv4()
    const filename = `${baseImageId}${fileExtension}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

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

    return NextResponse.json({
      baseImageId,
      url: `/uploads/base/${filename}`,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
