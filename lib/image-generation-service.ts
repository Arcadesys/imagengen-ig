import OpenAI from "openai"
import { createReadStream, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"
import { sanitizePromptForImage } from "./prompt-sanitizer"
import { checkPromptSafety } from "./prompt-moderator"
import { isAdminRequest } from "./admin"
import { saveImage } from "./images"
import { 
  dataURLToBuffer, 
  getBaseImagePath, 
  ensureDirectories, 
  validateGenerateRequest 
} from "./image-generation-utils"
import type { 
  GenerateRequest, 
  GeneratedImage, 
  ProgressEvent, 
  ImageGenerationResult,
  ImageGenerationOptions 
} from "./image-generation-types"
import type { NextRequest } from "next/server"

export class ImageGenerationService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Determine MIME type from file extension
   */
  private getImageMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
      case '.png': return 'image/png'
      case '.jpg':
      case '.jpeg': return 'image/jpeg'
      case '.webp': return 'image/webp'
      default: return 'image/png'
    }
  }

  /**
   * Convert any image to PNG format for OpenAI API compatibility
   * Resize if too large to meet 4MB limit
   */
  private async convertToPng(imagePath: string): Promise<Buffer> {
    console.log("[ImageGenerationService] Converting image to PNG:", imagePath)
    
    let pngBuffer: Buffer | undefined
    let width = 1024 // Start with reasonable size
    
    // Try different sizes until we get under 4MB
    while (width >= 512) {
      // Simple approach: directly convert with ensureAlpha
      pngBuffer = await sharp(imagePath)
        .resize(width, width, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .png({ quality: 90, compressionLevel: 6, palette: false })
        .toBuffer()
      
      const sizeMB = pngBuffer.length / (1024 * 1024)
      console.log(`[ImageGenerationService] PNG size at ${width}px: ${sizeMB.toFixed(2)}MB`)
      
      // Verify it's RGBA by checking metadata
      const metadata = await sharp(pngBuffer).metadata()
      console.log(`[ImageGenerationService] PNG metadata:`, {
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        space: metadata.space
      })
      
      if (pngBuffer.length < 4 * 1024 * 1024) { // Under 4MB
        break
      }
      
      width -= 128 // Reduce size and try again
    }
    
    if (!pngBuffer) {
      throw new Error("Failed to create PNG buffer")
    }
    
    console.log("[ImageGenerationService] PNG conversion complete, final size:", pngBuffer.length)
    return pngBuffer
  }

  /**
   * Generate images with optional progress reporting
   */
  async generateImages(
    request: GenerateRequest,
    nextRequest?: NextRequest,
    options: ImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    const { enableProgress = false, onProgress } = options

    // Send progress update helper
    const sendProgress = (event: ProgressEvent) => {
      if (enableProgress && onProgress) {
        onProgress(event)
      }
    }

    try {
      // Initial progress
      sendProgress({
        type: "progress",
        status: "idle",
        progress: 0,
        message: "Initializing generation...",
      })

      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      // Validate request
      const validation = validateGenerateRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid request")
      }

      const { prompt, expandedPrompt, size, n, seed, baseImageId, maskData } = request

      console.log("[ImageGenerationService] Request:", {
        prompt: prompt?.substring(0, 50) + "...",
        expanded: !!expandedPrompt,
        size,
        n,
        seed,
        baseImageId,
        hasMask: !!maskData,
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

  // Map requested square sizes to OpenAI-supported sizes.
  // As of current OpenAI API, supported values include '1024x1024', '1024x1536', '1536x1024', and 'auto'.
  // We only request square images in this app, so normalize to 1024x1024 for provider while preserving
  // the user's effectiveSize in metadata.
  const providerSize: "1024x1024" | "1024x1536" | "1536x1024" | "auto" = "1024x1024"

      const images: GeneratedImage[] = []

      if (maskData && baseImageId) {
        // Mask editing mode
        const result = await this.generateWithMask(
          finalPrompt, 
          baseImageId, 
          maskData, 
          providerSize, 
          effectiveSize, 
          expandedPrompt, 
          seed,
          sendProgress
        )
        images.push(result)
      } else if (baseImageId && !maskData) {
        // Image editing without mask
        const result = await this.generateImageEdit(
          finalPrompt, 
          baseImageId, 
          providerSize, 
          effectiveSize, 
          expandedPrompt, 
          seed,
          sendProgress
        )
        images.push(result)
      } else {
        // Standard generation
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
      }

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

  private async generateWithMask(
    finalPrompt: string,
    baseImageId: string,
    maskData: string,
  providerSize: "1024x1024" | "1024x1536" | "1536x1024" | "auto",
    effectiveSize: "512x512" | "768x768" | "1024x1024",
    expandedPrompt?: string | null,
    seed?: string | number | null,
    sendProgress?: (event: ProgressEvent) => void
  ): Promise<GeneratedImage> {
    console.log("[ImageGenerationService] Processing mask-based image editing")
    
    sendProgress?.({
      type: "progress",
      status: "processing",
      progress: 20,
      message: "Preparing mask editing...",
    })

    // Verify base image exists
    const baseImagePath = await getBaseImagePath(baseImageId)
    if (!baseImagePath) {
      throw new Error("Base image not found")
    }

    // Save mask data to temporary file
    const maskId = uuidv4()
    const tempDir = path.join(process.cwd(), "temp")
    const maskPath = path.join(tempDir, `${maskId}.png`)
    const maskDataBuffer = dataURLToBuffer(maskData)
    await writeFile(maskPath, maskDataBuffer)

    sendProgress?.({
      type: "progress",
      status: "generating",
      progress: 40,
      message: "Editing image with mask...",
    })

    console.log("[ImageGenerationService] Calling OpenAI image edit API...")
    console.log("[ImageGenerationService] Base image path:", baseImagePath)
    console.log("[ImageGenerationService] Mask path:", maskPath)
    
    // Convert images to PNG format for OpenAI API compatibility
    const baseImagePngBuffer = await this.convertToPng(baseImagePath)
    const maskPngBuffer = await this.convertToPng(maskPath)
    
    const baseImageFile = new File([baseImagePngBuffer], `base-${baseImageId}.png`, { 
      type: 'image/png' 
    })
    
    const maskFile = new File([maskPngBuffer], `mask-${maskId}.png`, { 
      type: 'image/png' 
    })
    
    console.log("[ImageGenerationService] Created PNG file objects:", 
      baseImageFile.name, baseImageFile.type, baseImageFile.size,
      maskFile.name, maskFile.type, maskFile.size)
    
    const response = await this.openai.images.edit({
      image: baseImageFile as any,
      mask: maskFile as any,
      prompt: finalPrompt,
      size: providerSize,
      n: 1,
    })

    if (!response.data || response.data.length === 0) {
      throw new Error("No images were generated")
    }

    sendProgress?.({
      type: "progress",
      status: "downloading",
      progress: 70,
      message: "Processing edited image...",
    })

    const imageData = response.data[0] as any
    const imageBufferArray = await this.downloadOrDecodeImage(imageData)

      const saved = await saveImage({
      kind: "GENERATED",
      mimeType: "image/png",
      buffer: Buffer.from(imageBufferArray),
      prompt: finalPrompt,
      expandedPrompt: expandedPrompt || undefined,
        // Do not persist size; DB "size" is deprecated in Auto mode
        size: undefined,
      seed: seed ?? undefined,
      baseImageId,
      hasMask: true,
      provider: "openai",
    })

    // Clean up temporary mask file
    try {
      await import("fs").then((fs) => fs.unlinkSync(maskPath))
    } catch (cleanupError) {
      console.warn("[ImageGenerationService] Failed to clean up temporary mask file:", cleanupError)
    }

    return {
      id: saved.id,
      url: saved.url,
      metadata: {
        prompt: saved.prompt || finalPrompt,
        expandedPrompt: saved.expandedPrompt || undefined,
  // size omitted in metadata by default (Auto)
  size: effectiveSize,
        seed: seed ?? undefined,
        baseImageId,
        hasMask: true,
        provider: "openai",
      },
    }
  }

  private async generateImageEdit(
    finalPrompt: string,
    baseImageId: string,
  providerSize: "1024x1024" | "1024x1536" | "1536x1024" | "auto",
    effectiveSize: "512x512" | "768x768" | "1024x1024",
    expandedPrompt?: string | null,
    seed?: string | number | null,
    sendProgress?: (event: ProgressEvent) => void
  ): Promise<GeneratedImage> {
    console.log("[ImageGenerationService] Processing full-image edit (no mask)")
    
    sendProgress?.({
      type: "progress",
      status: "processing",
      progress: 20,
      message: "Preparing image editing...",
    })

    // Verify base image exists
    const baseImagePath = await getBaseImagePath(baseImageId)
    if (!baseImagePath) {
      throw new Error("Base image not found")
    }

    sendProgress?.({
      type: "progress",
      status: "generating",
      progress: 40,
      message: "Editing image...",
    })

    console.log("[ImageGenerationService] Calling OpenAI image edit API (no mask)...")
    console.log("[ImageGenerationService] Base image path:", baseImagePath)
    
    // Convert image to PNG format for OpenAI API compatibility
    const baseImagePngBuffer = await this.convertToPng(baseImagePath)
    
    const baseImageFile = new File([baseImagePngBuffer], `base-${baseImageId}.png`, { 
      type: 'image/png' 
    })
    
    console.log("[ImageGenerationService] Created PNG file object:", baseImageFile.name, baseImageFile.type, baseImageFile.size)
    
    const response = await this.openai.images.edit({
      image: baseImageFile as any,
      prompt: finalPrompt,
      size: providerSize,
      n: 1,
    })

    if (!response.data || response.data.length === 0) {
      throw new Error("No images were generated")
    }

    sendProgress?.({
      type: "progress",
      status: "downloading",
      progress: 70,
      message: "Processing edited image...",
    })

    const imageData = response.data[0] as any
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

    return {
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
    }
  }

  private async generateStandard(
    finalPrompt: string,
  providerSize: "1024x1024" | "1024x1536" | "1536x1024" | "auto",
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