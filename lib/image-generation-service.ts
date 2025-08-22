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
    progressCallback?: ((event: ProgressEvent) => void) | { enableProgress?: boolean; onProgress?: (event: ProgressEvent) => void }
  ): Promise<ImageGenerationResult> {
    const sendProgress = (event: ProgressEvent) => {
      if (typeof progressCallback === "function") {
        progressCallback(event)
      } else if (progressCallback && typeof progressCallback === "object" && typeof progressCallback.onProgress === "function") {
        progressCallback.onProgress(event)
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

      const { prompt, expandedPrompt, size, n, seed, baseImageId, sessionId } = request

      console.log("[ImageGenerationService] Request:", {
        prompt: prompt?.substring(0, 50) + "...",
        expanded: !!expandedPrompt,
        size,
        n,
        seed,
        baseImageId,
      })

      // Enforce size rules: allow 512x512 and 1024x1024 for everyone; restrict non-square sizes to admins
      const isAdmin = nextRequest ? isAdminRequest(nextRequest) : true
      const requestedSize = (size ?? "1024x1024") as "512x512" | "768x768" | "1024x1024" | "1024x1536" | "1536x1024"
      type EffectiveSize = "512x512" | "768x768" | "1024x1024" | "1024x1536" | "1536x1024"
      let effectiveSize: EffectiveSize
      if (requestedSize === "512x512" || requestedSize === "1024x1024") {
        effectiveSize = requestedSize
      } else {
        effectiveSize = isAdmin ? requestedSize : "1024x1024"
      }

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
      let finalPrompt = sanitizePromptForImage(sourcePrompt)

      // Helper: detect puppet intent to encourage paint-over transformation
      const hasPuppetIntent = /\b(puppet|muppet|sock|felt|plush|marionette|rod puppet|hand puppet|yarn|felted)\b/i.test(finalPrompt)

      // If we have a reference image, strongly encourage a paint-over workflow that preserves the background
      if (baseImageId) {
        if (hasPuppetIntent) {
          finalPrompt +=
            " Paint-over transformation: Keep the original background and environment from the reference photo unchanged. Replace only the primary subject with a puppet interpretation of the same person. Preserve pose, framing, and lighting. Preserve clothing items, colors, patterns, accessories; simply re-materialize them as fabric/yarn/felt textures. Maintain human anatomy and identity unless a nonhuman species is explicitly requested. No additional characters, no background changes."
        } else {
          finalPrompt +=
            " Keep the original background and environment from the reference photo unchanged. Match camera framing and lighting. Replace only the subject as described; do not add extra people or objects."
        }
      }

      // Map requested/effective size to provider-supported size for OpenAI (square only)
      type ProviderSize = "512x512" | "1024x1024"
      const providerSize: ProviderSize = effectiveSize === "512x512" ? "512x512" : "1024x1024"

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
        sessionId,
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
    providerSize: "512x512" | "1024x1024",
    n: number,
    effectiveSize: "512x512" | "768x768" | "1024x1024" | "1024x1536" | "1536x1024",
    expandedPrompt?: string | null,
    seed?: string | number | null,
    baseImageId?: string | null,
    sessionId?: string | null,
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
          sessionId: sessionId ?? undefined,
        })

        images.push({
          id: saved.id,
          url: saved.url,
          metadata: {
            prompt: saved.prompt || finalPrompt,
            expandedPrompt: finalPrompt, // Show the actual prompt sent to OpenAI
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
