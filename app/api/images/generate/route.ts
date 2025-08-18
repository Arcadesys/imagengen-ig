import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

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
    provider: string
  }
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
  const { prompt, expandedPrompt, size, n, seed, baseImageId } = body

  console.log("[v0] Request body parsed:", { prompt: prompt?.substring(0, 50) + "...", expanded: !!expandedPrompt, size, n, seed, baseImageId })

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

    // Ensure directories exist
    const generatedDir = path.join(process.cwd(), "public", "generated")
    const dataDir = path.join(process.cwd(), "data")

    if (!existsSync(generatedDir)) {
      await mkdir(generatedDir, { recursive: true })
    }
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    console.log("[v0] Directories ensured, making OpenAI request")

    const openaiRequest: any = {
      model: "dall-e-2", // Using DALL-E 2 which supports n=1-4
      prompt,
      size,
      n: n,
      response_format: "url",
    }

    // Handle base image for image-to-image (if supported)
    if (baseImageId) {
      // For now, we'll include the base image context in the prompt
      // In a full implementation, you'd handle the actual image-to-image API
      openaiRequest.prompt = `Based on the uploaded image with ID ${baseImageId}: ${prompt}`
    }

    console.log("[v0] OpenAI request prepared:", {
      model: openaiRequest.model,
      size: openaiRequest.size,
      n: openaiRequest.n,
    })

    const images: GeneratedImage[] = []

    try {
      console.log("[v0] Calling OpenAI API...")
      const response = await openai.images.generate(openaiRequest)
      console.log("[v0] OpenAI API response received, data length:", response.data?.length)

      if (!response.data || response.data.length === 0) {
        console.log("[v0] No images in OpenAI response")
        return NextResponse.json({ error: "No images were generated" }, { status: 500 })
      }

      // Process each generated image
      for (let i = 0; i < response.data.length; i++) {
        const imageData = response.data[i]
        console.log("[v0] Processing image", i, "URL present:", !!imageData?.url)

        if (!imageData?.url) {
          console.error(`[v0] Image ${i} has no URL`)
          continue
        }

        try {
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
          const imageBuffer = await imageResponse.arrayBuffer()

          const imageId = uuidv4()
          const filename = `${imageId}.png`
          const filepath = path.join(generatedDir, filename)

          console.log("[v0] Saving image", i, "to", filepath)
          await writeFile(filepath, Buffer.from(imageBuffer))

          images.push({
            id: imageId,
            url: `/generated/${filename}`,
            metadata: {
              prompt,
              expandedPrompt: expandedPrompt || undefined,
              size,
              seed: seed ?? undefined,
              baseImageId,
              provider: "openai",
            },
          })
          console.log("[v0] Successfully processed image", i)
        } catch (downloadError) {
          console.error(`[v0] Error downloading image ${i}:`, downloadError)
          // Continue with other images
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
