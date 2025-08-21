import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
  const { id: photoId } = await context.params
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
