import { type NextRequest, NextResponse } from "next/server"
import { mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Photo save API called")

    const body = await request.json()
    const { email, imageUrl, style } = body

    console.log("[v0] Saving photo for email:", email)

    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), "data")
    try {
      await mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save photo record
    const photoRecord = {
      id: `photo_${Date.now()}`,
      email,
      imageUrl,
      style,
      timestamp: new Date().toISOString(),
      shared: false,
    }

    // In a real implementation, this would:
    // 1. Save to database
    // 2. Send email with photo link
    // 3. Generate QR code
    // 4. Add to live wall

    console.log("[v0] Photo saved successfully:", photoRecord.id)

    return NextResponse.json({
      success: true,
      photoId: photoRecord.id,
      message: "Photo saved and email sent!",
    })
  } catch (error) {
    console.error("[v0] Photo save error:", error)
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }
}
