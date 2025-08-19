import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { writeFile, mkdir } from "fs/promises"
import { existsSync, createReadStream } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { sanitizePromptForImage } from "../../../../lib/prompt-sanitizer"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateRequest {
  prompt: string
  expandedPrompt?: string | null
  size: "512x512" | "768x768" | "1024x1024"
  n: number
  seed?: string | number | null
  baseImageId?: string | null
  maskData?: string | null
}

interface GeneratedImage {
  id: string
  url: string
  metadata: {
    prompt: string
    expandedPrompt?: string
    size: string
    seed?: string | number
    baseImageId?: string | null
    hasMask?: boolean
    provider: string
  }
}

function dataURLToBuffer(dataURL: string): Buffer {
  const base64Data = dataURL.split(",")[1]
  return Buffer.from(base64Data, "base64")
}

function getBaseImagePath(baseImageId: string): string | null {
  const baseDir = path.join(process.cwd(), "public", "uploads", "base")
  const exts = [".png", ".jpg", ".jpeg", ".webp", ".avif"]
  for (const ext of exts) {
    const p = path.join(baseDir, `${baseImageId}${ext}`)
    if (existsSync(p)) return p
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting image generation request")

    if (!process.env.OPENAI_API_KEY) {
      console.log("[v0] OpenAI API key is missing")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    console.log("[v0] OpenAI API key is present")

    const body: GenerateRequest = await request.json()
  const { prompt, expandedPrompt, size, n, seed, baseImageId, maskData } = body

    console.log("[v0] Request body parsed:", {
      prompt: prompt?.substring(0, 50) + "...",
      expanded: !!expandedPrompt,
      size,
      n,
      seed,
      baseImageId,
      hasMask: !!maskData,
    })

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 })
    }

    if (!["512x512", "768x768", "1024x1024"].includes(size)) {
      return NextResponse.json({ error: "Invalid size. Must be 512x512, 768x768, or 1024x1024" }, { status: 400 })
    }

    if (!n || n < 1 || n > 4) {
      return NextResponse.json({ error: "Number of images must be between 1 and 4" }, { status: 400 })
    }

    if (maskData && !baseImageId) {
      return NextResponse.json({ error: "Base image is required when using mask" }, { status: 400 })
    }

    if (maskData && n > 1) {
      return NextResponse.json({ error: "Mask editing only supports generating 1 image at a time" }, { status: 400 })
    }

    // Ensure directories exist
    const generatedDir = path.join(process.cwd(), "public", "generated")
    const dataDir = path.join(process.cwd(), "data")
    const tempDir = path.join(process.cwd(), "temp")

    if (!existsSync(generatedDir)) {
      await mkdir(generatedDir, { recursive: true })
    }
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    console.log("[v0] Directories ensured, making OpenAI request")

    const images: GeneratedImage[] = []

    try {
      // Build final prompt sent to provider
      const finalPrompt = sanitizePromptForImage(expandedPrompt?.trim() ? expandedPrompt! : prompt)
      // Map unsupported provider size to nearest supported for OpenAI
      const providerSize: "256x256" | "512x512" | "1024x1024" =
        size === "768x768" ? "1024x1024" : (size as "256x256" | "512x512" | "1024x1024")
      if (maskData && baseImageId) {
        console.log("[v0] Processing mask-based image editing")

        // Verify base image exists
  const baseImagePath = getBaseImagePath(baseImageId)
  if (!baseImagePath) {
          return NextResponse.json({ error: "Base image not found" }, { status: 400 })
        }

        // Save mask data to temporary file
        const maskId = uuidv4()
        const maskPath = path.join(tempDir, `${maskId}.png`)
        const maskBuffer = dataURLToBuffer(maskData)
        await writeFile(maskPath, maskBuffer)

        console.log("[v0] Calling OpenAI image edit API...")
        const response = await openai.images.edit({
          image: createReadStream(baseImagePath),
          mask: createReadStream(maskPath),
          prompt: finalPrompt,
          size: providerSize,
          n: 1, // Image editing only supports n=1
        })

        console.log("[v0] OpenAI image edit response received")

        if (!response.data || response.data.length === 0) {
          console.log("[v0] No images in OpenAI response")
          return NextResponse.json({ error: "No images were generated" }, { status: 500 })
        }

        const imageData = response.data[0] as any
        let imageBufferArray: ArrayBuffer
        if (imageData?.url) {
          // Download and save the edited image via URL
          console.log("[v0] Downloading edited image")
          const imageResponse = await fetch(imageData.url)

          if (!imageResponse.ok) {
            console.error(`[v0] Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
            return NextResponse.json({ error: "Failed to download generated image" }, { status: 500 })
          }

          imageBufferArray = await imageResponse.arrayBuffer()
        } else if (imageData?.b64_json) {
          // Handle base64-encoded image
          console.log("[v0] Decoding base64 edited image")
          imageBufferArray = Buffer.from(imageData.b64_json, "base64").buffer
        } else {
          console.error("[v0] Image has neither URL nor base64 data")
          return NextResponse.json({ error: "Generated image missing URL and base64 data" }, { status: 500 })
        }
        const imageId = uuidv4()
        const filename = `${imageId}.png`
        const filepath = path.join(generatedDir, filename)

  await writeFile(filepath, Buffer.from(imageBufferArray))

        images.push({
          id: imageId,
          url: `/generated/${filename}`,
          metadata: {
            prompt: finalPrompt,
            expandedPrompt: expandedPrompt || undefined,
            size,
            seed: seed ?? undefined,
            baseImageId,
            hasMask: true,
            provider: "openai",
          },
        })

        // Clean up temporary mask file
        try {
          await import("fs").then((fs) => fs.unlinkSync(maskPath))
        } catch (cleanupError) {
          console.warn("[v0] Failed to clean up temporary mask file:", cleanupError)
        }
      } else {
  const openaiRequest: any = {
          model: "gpt-image-1",
          prompt: finalPrompt,
          size: providerSize,
          n: n,
        }

        // Note: We avoid embedding internal IDs or meta text into the prompt to
        // prevent the model from rendering stray text. Image-to-image is handled
        // via the edit path when a mask/base image is provided.

        console.log("[v0] OpenAI request prepared:", {
          model: openaiRequest.model,
          size: openaiRequest.size,
          n: openaiRequest.n,
        })

        console.log("[v0] Calling OpenAI API...")
        const response = await openai.images.generate(openaiRequest)
        console.log("[v0] OpenAI API response received, data length:", response.data?.length)

        if (!response.data || response.data.length === 0) {
          console.log("[v0] No images in OpenAI response")
          return NextResponse.json({ error: "No images were generated" }, { status: 500 })
        }

        // Process each generated image
        for (let i = 0; i < response.data.length; i++) {
          const imageData = response.data[i] as any
          console.log("[v0] Processing image", i, "URL present:", !!imageData?.url, "b64 present:", !!imageData?.b64_json)

          try {
            let imageBufferArray: ArrayBuffer
            if (imageData?.url) {
              console.log("[v0] Downloading image", i)
              const imageResponse = await fetch(imageData.url)

              if (!imageResponse.ok) {
                console.error(`[v0] Failed to download image ${i}: ${imageResponse.status} ${imageResponse.statusText}`)
                continue
              }

              const contentType = imageResponse.headers.get("content-type")
              if (!contentType?.startsWith("image/")) {
                console.error(`[v0] Invalid content type for image ${i}: ${contentType}`)
                continue
              }

              console.log("[v0] Converting image", i, "to buffer")
              imageBufferArray = await imageResponse.arrayBuffer()
            } else if (imageData?.b64_json) {
              console.log("[v0] Decoding base64 image", i)
              imageBufferArray = Buffer.from(imageData.b64_json, "base64").buffer
            } else {
              console.error(`[v0] Image ${i} has neither URL nor base64 data`)
              continue
            }

            const imageId = uuidv4()
            const filename = `${imageId}.png`
            const filepath = path.join(generatedDir, filename)

            console.log("[v0] Saving image", i, "to", filepath)
            await writeFile(filepath, Buffer.from(imageBufferArray))

            images.push({
              id: imageId,
              url: `/generated/${filename}`,
              metadata: {
                prompt: finalPrompt,
                expandedPrompt: expandedPrompt || undefined,
                size,
                seed: seed ?? undefined,
                baseImageId,
                hasMask: false,
                provider: "openai",
              },
            })
            console.log("[v0] Successfully processed image", i)
          } catch (downloadError) {
            console.error(`[v0] Error downloading image ${i}:`, downloadError)
            // Continue with other images
          }
        }
      }

      if (images.length === 0) {
        console.log("[v0] No images were successfully processed")
        return NextResponse.json({ error: "Failed to download any generated images" }, { status: 500 })
      }

      console.log("[v0] Successfully generated", images.length, "images")
      return NextResponse.json({ images })
    } catch (openaiError: any) {
      console.error("[v0] OpenAI API error:", openaiError)

      if (openaiError?.status === 401) {
        return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 500 })
      }

      if (openaiError?.status === 429) {
        return NextResponse.json({ error: "OpenAI API rate limit exceeded. Please try again later." }, { status: 500 })
      }

      if (openaiError?.error?.message) {
        return NextResponse.json({ error: `OpenAI API error: ${openaiError.error.message}` }, { status: 500 })
      }

      return NextResponse.json({ error: "Failed to generate images with OpenAI" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error generating images:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    if (error instanceof Error) {
      console.error("[v0] Error details:", error.message, error.stack)
      return NextResponse.json({ error: `Failed to generate images: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to generate images" }, { status: 500 })
  }
}
