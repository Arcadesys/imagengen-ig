import type { NextRequest } from "next/server"
import { ImageGenerationService } from "../../../../../lib/image-generation-service"
import type { 
  GenerateRequest, 
  ProgressEvent 
} from "../../../../../lib/image-generation-types"

// Ensure this route runs on Node.js runtime and never caches
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function sendProgressEvent(encoder: TextEncoder, controller: ReadableStreamDefaultController, event: ProgressEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  controller.enqueue(encoder.encode(data))
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: GenerateRequest = await request.json()
        const imageService = new ImageGenerationService()
        
        await imageService.generateImages(body, request, {
          enableProgress: true,
          onProgress: (event: ProgressEvent) => {
            sendProgressEvent(encoder, controller, event)
            
            // Close stream when complete or error
            if (event.type === "complete" || event.type === "error") {
              controller.close()
            }
          }
        })
      } catch (error: any) {
        console.error("[v0] Streaming generation error:", error)
        
        const errorMessage = error.message || "Generation failed"
        sendProgressEvent(encoder, controller, {
          type: "error",
          status: "error",
          progress: 0,
          message: errorMessage,
          error: errorMessage,
        })

        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}