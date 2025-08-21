import OpenAI from "openai"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { sanitizePromptForImage } from "./prompt-sanitizer"
import { checkPromptSafety } from "./prompt-moderator"
import { isAdminRequest } from "./admin"
import { saveImage } from "./images"
import { 
  ensureDirectories, 
  validateGenerateRequest 
} from "./image-generation-utils"
import type { 
  GenerateRequest, 
  GeneratedImage, 
  ProgressEvent, 
  ImageGenerationResult 
} from "./image-generation-types"
import type { NextRequest } from "next/server"

export class ImageGenerationService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generateImages(
    request: GenerateRequest,
    nextRequest?: NextRequest,
    progressCallback?: (event: ProgressEvent) => void
  ): Promise<ImageGenerationResult> {
    const sendProgress = (event: ProgressEvent) => {
      if (progressCallback) {
        progressCallback(event)
      }
    }

    try {
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      // Validate request
      const validation = validateGenerateRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid request")
      }

      const { prompt, expandedPrompt, size, n, seed, baseImageId } = request

      console.log("[ImageGenerationService] Request:", {
        prompt: prompt?.substring(0, 50) + "...",
        expanded: !!expandedPrompt,
        size,
        n,
        seed,
        baseImageId,
      })

      // Enforce 512x512 for non-admins
      const allowRequestedSize = nextRequest ? isAdminRequest(nextRequest) : true
      // Default to 512x512 when size is omitted (Auto). Non-admins are pinned to 512x512.
      const requestedSize = size ?? "512x512"
      const effectiveSize: "512x512" | "768x768" | "1024x1024" = allowRequestedSize ? requestedSize : "512x512"

      // Content safety check
      const safety = checkPromptSafety(expandedPrompt?.trim() ? expandedPrompt! : prompt)
      if (!safety.allowed) {
        throw new Error(
          `Content not allowed: ${safety.reason || "Your request contains disallowed content"}`
        )
      }

      // Ensure directories exist
      await ensureDirectories()
      sendProgress({
        type: "progress",
        status: "processing",
        progress: 10,
        message: "Setting up generation...",
      })

      // Build final prompt
      const sourcePrompt = safety.cleaned ?? (expandedPrompt?.trim() ? expandedPrompt! : prompt)
      const finalPrompt = sanitizePromptForImage(sourcePrompt)

      // For OpenAI API, we'll use the effective size directly since the tests expect this
      const providerSize = effectiveSize

      const images: GeneratedImage[] = []

      // Standard generation only - no mask or image editing
      const results = await this.generateStandard(
        finalPrompt, 
        providerSize, 
        n, 
        effectiveSize, 
        expandedPrompt, 
        seed, 
        baseImageId,
        sendProgress
      )
      images.push(...results)

      if (images.length === 0) {
        throw new Error("No images were successfully generated")
      }

      sendProgress({
        type: "complete",
        status: "complete",
        progress: 100,
        message: `Generated ${images.length} image${images.length > 1 ? 's' : ''}`,
        generatedCount: images.length,
        totalCount: n,
        images,
      })

      console.log("[ImageGenerationService] Successfully generated", images.length, "images")
      return { images }
    } catch (error: any) {
      console.error("[ImageGenerationService] Error:", error)
      
      sendProgress({
        type: "error",
        status: "error",
        progress: 0,
        message: error.message || "Generation failed",
        error: error.message || "Generation failed",
      })
      
      throw error
    }
  }

  private async generateStandard(
    finalPrompt: string,
    providerSize: "512x512" | "768x768" | "1024x1024",
    n: number,
    effectiveSize: "512x512" | "768x768" | "1024x1024",
    expandedPrompt?: string | null,
    seed?: string | number | null,
    baseImageId?: string | null,
    sendProgress?: (event: ProgressEvent) => void
  ): Promise<GeneratedImage[]> {
    sendProgress?.({
      type: "progress",
      status: "generating",
      progress: 30,
      message: "Sending request to AI image generator...",
      totalCount: n,
    })

    const openaiRequest: any = {
      model: "gpt-image-1",
      prompt: finalPrompt,
      size: providerSize,
      n: n,
    }

    console.log("[ImageGenerationService] OpenAI request prepared:", {
      model: openaiRequest.model,
      size: openaiRequest.size,
      n: openaiRequest.n,
    })

    console.log("[ImageGenerationService] Calling OpenAI API...")
    const response = await this.openai.images.generate(openaiRequest)
    console.log("[ImageGenerationService] OpenAI API response received, data length:", response.data?.length)

    if (!response.data || response.data.length === 0) {
      throw new Error("No images were generated")
    }

    sendProgress?.({
      type: "progress",
      status: "downloading",
      progress: 60,
      message: "Downloading generated images...",
      totalCount: n,
    })

    const images: GeneratedImage[] = []

    // Process each generated image
    for (let i = 0; i < response.data.length; i++) {
      const imageData = response.data[i] as any
      console.log("[ImageGenerationService] Processing image", i, "URL present:", !!imageData?.url, "b64 present:", !!imageData?.b64_json)

      try {
        const imageBufferArray = await this.downloadOrDecodeImage(imageData)
        
        const saved = await saveImage({
          kind: "GENERATED",
          mimeType: "image/png",
          buffer: Buffer.from(imageBufferArray),
          prompt: finalPrompt,
          expandedPrompt: expandedPrompt || undefined,
          size: undefined,
          seed: seed ?? undefined,
          baseImageId,
          hasMask: false,
          provider: "openai",
        })

        images.push({
          id: saved.id,
          url: saved.url,
          metadata: {
            prompt: saved.prompt || finalPrompt,
            expandedPrompt: saved.expandedPrompt || undefined,
            size: effectiveSize,
            seed: seed ?? undefined,
            baseImageId,
            hasMask: false,
            provider: "openai",
          },
        })

        sendProgress?.({
          type: "progress",
          status: "downloading",
          progress: 60 + (i + 1) * 30 / response.data.length,
          message: `Processing image ${i + 1} of ${response.data.length}...`,
          generatedCount: i + 1,
          totalCount: n,
        })

        console.log("[ImageGenerationService] Successfully processed image", i)
      } catch (downloadError) {
        console.error(`[ImageGenerationService] Error downloading image ${i}:`, downloadError)
        // Continue with other images
      }
    }

    return images
  }

  private async downloadOrDecodeImage(imageData: any): Promise<ArrayBuffer> {
    if (imageData?.url) {
      console.log("[ImageGenerationService] Downloading image via URL")
      const imageResponse = await fetch(imageData.url)

      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
      }

      const contentType = imageResponse.headers.get("content-type")
      if (!contentType?.startsWith("image/")) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      return await imageResponse.arrayBuffer()
    } else if (imageData?.b64_json) {
      console.log("[ImageGenerationService] Decoding base64 image")
      return Buffer.from(imageData.b64_json, "base64").buffer
    } else {
      throw new Error("Image has neither URL nor base64 data")
    }
  }
}
