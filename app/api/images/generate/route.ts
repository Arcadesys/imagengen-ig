import { type NextRequest, NextResponse } from "next/server"
// Defer runtime import of the service to avoid top-level side effects in dev
import type { GenerateRequest } from "../../../../lib/image-generation-types"

// Ensure this route runs on Node.js runtime and never caches
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// Explicit GET to avoid 405 in certain dev-server evaluation states
export async function GET() {
  return NextResponse.json({ ok: true, message: "Use POST to generate images" })
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting image generation request")

    const body: GenerateRequest = await request.json()
    const { ImageGenerationService } = await import("../../../../lib/image-generation-service")
    const imageService = new ImageGenerationService()
    
    const result = await imageService.generateImages(body, request)
    
    console.log("[v0] Successfully generated", result.images.length, "images")
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error generating images:", error)

    // Handle specific error types
    if (error.message?.includes("API key is not configured")) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    if (error.message?.includes("Content not allowed")) {
      return NextResponse.json(
        {
          error: "Your request contains disallowed content and cannot be processed. Please adjust the wording and try again.",
          reason: error.message,
        },
        { status: 400 },
      )
    }

    if (error.message?.includes("Prompt is required") || 
        error.message?.includes("Invalid size") || 
        error.message?.includes("Number of images") ||
        error.message?.includes("Base image is required") ||
        error.message?.includes("Mask editing only supports") ||
        error.message?.includes("512x512")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Handle OpenAI specific errors
    if (error?.status === 401) {
      return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 500 })
    }

    if (error?.status === 429) {
      return NextResponse.json({ error: "OpenAI API rate limit exceeded. Please try again later." }, { status: 500 })
    }

    if (error?.error?.message) {
      return NextResponse.json({ error: `OpenAI API error: ${error.error.message}` }, { status: 500 })
    }

    return NextResponse.json({ error: error.message || "Failed to generate images" }, { status: 500 })
  }
}
