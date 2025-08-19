import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Wall API called")

    // In a real implementation, this would:
    // 1. Get current active event
    // 2. Fetch all photos for that event from database
    // 3. Return photos sorted by timestamp (newest first)

    // Mock data for demonstration
    const mockPhotos = [
      {
        id: "photo_1",
        imageUrl: "/ai-cartoon-photo.png",
        style: "cartoon",
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      },
      {
        id: "photo_2",
        imageUrl: "/ai-anime-style-photo.png",
        style: "anime",
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      },
      {
        id: "photo_3",
        imageUrl: "/ai-pixar-style.png",
        style: "pixar",
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      },
      {
        id: "photo_4",
        imageUrl: "/ai-watercolor-photo.png",
        style: "watercolor",
        timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
      },
      {
        id: "photo_5",
        imageUrl: "/ai-comic-style-photo.png",
        style: "comic",
        timestamp: new Date(Date.now() - 1500000).toISOString(), // 25 minutes ago
      },
      {
        id: "photo_6",
        imageUrl: "/ai-vintage-photo.png",
        style: "vintage",
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      },
    ]

    console.log("[v0] Returning", mockPhotos.length, "photos for wall")

    return NextResponse.json({
      success: true,
      photos: mockPhotos,
      totalCount: mockPhotos.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Wall API error:", error)
    return NextResponse.json({ error: "Failed to load wall photos" }, { status: 500 })
  }
}
