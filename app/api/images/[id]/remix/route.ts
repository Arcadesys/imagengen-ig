import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const imageId = params.id
    const { style, sessionId } = await request.json()
    
    // Find the original image
    const originalImage = await (prisma as any).image.findUnique({
      where: { id: imageId },
      include: {
        session: true
      }
    })
    
    if (!originalImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // For remix, we need the base image (before transformation)
    let baseImageId = originalImage.baseImageId
    
    // If this is already a generated image, use its base
    if (!baseImageId) {
      // If no base image, can't remix
      return NextResponse.json({ 
        error: "Cannot remix - no base image found" 
      }, { status: 400 })
    }

    // Redirect to the appropriate generator with the base image and style
    const redirectUrl = `/photobooth?baseImage=${baseImageId}&style=${encodeURIComponent(style)}&sessionId=${sessionId || ''}`
    
    return NextResponse.json({
      success: true,
      redirectUrl: redirectUrl,
      message: "Remix prepared"
    })
  } catch (error) {
    console.error("[Remix API] Error:", error)
    return NextResponse.json({ 
      error: "Failed to prepare remix" 
    }, { status: 500 })
  }
}
