import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    console.log("[v0] Generating QR code for URL:", url)

    // Generate QR code using a service (in production, you'd use a proper QR library)
    // For now, using a placeholder QR code service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      originalUrl: url,
    })
  } catch (error) {
    console.error("[v0] QR code generation error:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
