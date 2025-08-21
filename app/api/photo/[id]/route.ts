import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const photoId = params.id
    console.log("[v0] Fetching photo:", photoId)

    // In a real implementation, this would fetch from database
    // For now, return mock data
    const mockPhoto = {
      id: photoId,
      imageUrl: `/placeholder.svg?height=400&width=400&query=AI+generated+photo+${photoId}`,
      style: "cartoon",
      timestamp: new Date().toISOString(),
      email: "user@example.com",
    }

    return NextResponse.json(mockPhoto)
  } catch (error) {
    console.error("[v0] Photo fetch error:", error)
    return NextResponse.json({ error: "Photo not found" }, { status: 404 })
  }
}
