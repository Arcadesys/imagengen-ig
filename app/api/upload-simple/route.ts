import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[simple-upload] Upload API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[simple-upload] File received:", file.name, file.type, file.size)

    // Validate file type
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
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, JPG, WebP, HEIC/HEIF, and AVIF are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a simple ID and create a data URL for now
    // In production, you'd want to store this properly
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    console.log("[simple-upload] Upload successful:", id)

    return NextResponse.json({ 
      id: id,
      baseImageId: id,
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error("[simple-upload] Error:", error)
    return NextResponse.json({ 
      error: "Failed to upload file" 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Simple upload endpoint ready",
    methods: ["POST"]
  })
}
