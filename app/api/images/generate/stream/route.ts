import type { NextRequest } from "next/server"
import OpenAI from "openai"
import { writeFile, mkdir, readFile } from "fs/promises"
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

interface ProgressEvent {
  type: "progress" | "complete" | "error"
  status: "idle" | "uploading" | "processing" | "generating" | "downloading" | "complete" | "error"
  progress: number
  message: string
  generatedCount?: number
  totalCount?: number
  images?: GeneratedImage[]
  error?: string
}

function sendProgressEvent(encoder: TextEncoder, controller: ReadableStreamDefaultController, event: ProgressEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  controller.enqueue(encoder.encode(data))
}

function dataURLToBuffer(dataURL: string): Buffer {
  const base64Data = dataURL.split(",")[1]
  return Buffer.from(base64Data, "base64")
}

function getBaseImagePath(baseImageId: string): string {
  return path.join(process.cwd(), "public", "uploads", "base", `${baseImageId}.png`)
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log("[v0] Starting streaming image generation request")

        // Send initial progress
        sendProgressEvent(encoder, controller, {
          type: "progress",
          status: "idle",
          progress: 0,
          message: "Initializing generation...",
        })

        if (!process.env.OPENAI_API_KEY) {
          console.log("[v0] OpenAI API key is missing")
          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 0,
            message: "OpenAI API key is not configured",
            error: "OpenAI API key is not configured",
          })
          controller.close()
          return
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
          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 0,
            message: "Prompt is required",
            error: "Prompt is required and must be a string",
          })
          controller.close()
          return
        }

        if (!["512x512", "768x768", "1024x1024"].includes(size)) {
          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 0,
            message: "Invalid image size",
            error: "Invalid size. Must be 512x512, 768x768, or 1024x1024",
          })
          controller.close()
          return
        }

        if (!n || n < 1 || n > 4) {
          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 0,
            message: "Invalid number of images",
            error: "Number of images must be between 1 and 4",
          })
          controller.close()
          return
        }

        if (maskData && !baseImageId) {
          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 0,
            message: "Base image required for mask editing",
            error: "Base image is required when using mask",
          })
          controller.close()
          return
        }

        if (maskData && n > 1) {
          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 0,
            message: "Mask editing supports only 1 image",
            error: "Mask editing only supports generating 1 image at a time",
          })
          controller.close()
          return
        }

        // Send processing progress
        sendProgressEvent(encoder, controller, {
          type: "progress",
          status: "processing",
          progress: 10,
          message: "Preparing directories and files...",
          totalCount: n,
        })

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
          if (maskData && baseImageId) {
            console.log("[v0] Processing mask-based image editing")

            sendProgressEvent(encoder, controller, {
              type: "progress",
              status: "uploading",
              progress: 20,
              message: "Processing base image and mask...",
              totalCount: n,
            })

            // Verify base image exists
            const baseImagePath = getBaseImagePath(baseImageId)
            if (!existsSync(baseImagePath)) {
              sendProgressEvent(encoder, controller, {
                type: "error",
                status: "error",
                progress: 20,
                message: "Base image not found",
                error: "Base image not found",
              })
              controller.close()
              return
            }

            // Save mask data to temporary file
            const maskId = uuidv4()
            const maskPath = path.join(tempDir, `${maskId}.png`)
            const maskBuffer = dataURLToBuffer(maskData)
            await writeFile(maskPath, maskBuffer)

            sendProgressEvent(encoder, controller, {
              type: "progress",
              status: "generating",
              progress: 40,
              message: "Generating edited image with AI...",
              totalCount: n,
            })

            console.log("[v0] Calling OpenAI image edit API...")
            const response = await openai.images.edit({
              image: await readFile(baseImagePath),
              mask: await readFile(maskPath),
              prompt,
              size: size as "256x256" | "512x512" | "1024x1024",
              n: 1,
              response_format: "url",
            })

            console.log("[v0] OpenAI image edit response received")

            if (!response.data || response.data.length === 0) {
              console.log("[v0] No images in OpenAI response")
              sendProgressEvent(encoder, controller, {
                type: "error",
                status: "error",
                progress: 40,
                message: "No images were generated",
                error: "No images were generated",
              })
              controller.close()
              return
            }

            sendProgressEvent(encoder, controller, {
              type: "progress",
              status: "downloading",
              progress: 70,
              message: "Downloading and saving edited image...",
              totalCount: n,
            })

            const imageData = response.data[0]
            if (!imageData?.url) {
              console.error("[v0] Image has no URL")
              sendProgressEvent(encoder, controller, {
                type: "error",
                status: "error",
                progress: 70,
                message: "Generated image has no URL",
                error: "Generated image has no URL",
              })
              controller.close()
              return
            }

            // Download and save the edited image
            console.log("[v0] Downloading edited image")
            const imageResponse = await fetch(imageData.url)

            if (!imageResponse.ok) {
              console.error(`[v0] Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
              sendProgressEvent(encoder, controller, {
                type: "error",
                status: "error",
                progress: 70,
                message: "Failed to download generated image",
                error: "Failed to download generated image",
              })
              controller.close()
              return
            }

            const imageBuffer = await imageResponse.arrayBuffer()
            const imageId = uuidv4()
            const filename = `${imageId}.png`
            const filepath = path.join(generatedDir, filename)

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

            sendProgressEvent(encoder, controller, {
              type: "progress",
              status: "downloading",
              progress: 90,
              message: "Finalizing edited image...",
              generatedCount: 1,
              totalCount: n,
            })
          } else {
            sendProgressEvent(encoder, controller, {
              type: "progress",
              status: "generating",
              progress: 30,
              message: "Sending request to AI image generator...",
              totalCount: n,
            })

            const openaiRequest: any = {
              model: "dall-e-2",
              prompt,
              size,
              n: n,
              response_format: "url",
            }

            if (baseImageId) {
              openaiRequest.prompt = `Based on the uploaded image with ID ${baseImageId}: ${prompt}`
            }

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
              sendProgressEvent(encoder, controller, {
                type: "error",
                status: "error",
                progress: 30,
                message: "No images were generated",
                error: "No images were generated",
              })
              controller.close()
              return
            }

            sendProgressEvent(encoder, controller, {
              type: "progress",
              status: "downloading",
              progress: 60,
              message: "Downloading generated images...",
              totalCount: n,
            })

            // Process each generated image
            for (let i = 0; i < response.data.length; i++) {
              const imageData = response.data[i]
              console.log("[v0] Processing image", i, "URL present:", !!imageData?.url)

              const currentProgress = 60 + (i / response.data.length) * 30

              sendProgressEvent(encoder, controller, {
                type: "progress",
                status: "downloading",
                progress: currentProgress,
                message: `Downloading image ${i + 1} of ${response.data.length}...`,
                generatedCount: i,
                totalCount: n,
              })

              if (!imageData?.url) {
                console.error(`[v0] Image ${i} has no URL`)
                continue
              }

              try {
                console.log("[v0] Downloading image", i)
                const imageResponse = await fetch(imageData.url)

                if (!imageResponse.ok) {
                  console.error(
                    `[v0] Failed to download image ${i}: ${imageResponse.status} ${imageResponse.statusText}`,
                  )
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
            sendProgressEvent(encoder, controller, {
              type: "error",
              status: "error",
              progress: 90,
              message: "Failed to download any generated images",
              error: "Failed to download any generated images",
            })
            controller.close()
            return
          }

          console.log("[v0] Successfully generated", images.length, "images")

          // Send completion event
          sendProgressEvent(encoder, controller, {
            type: "complete",
            status: "complete",
            progress: 100,
            message: `Successfully generated ${images.length} image${images.length > 1 ? "s" : ""}!`,
            generatedCount: images.length,
            totalCount: n,
            images,
          })

          controller.close()
        } catch (openaiError: any) {
          console.error("[v0] OpenAI API error:", openaiError)

          let errorMessage = "Failed to generate images with OpenAI"
          if (openaiError?.status === 401) {
            errorMessage = "Invalid OpenAI API key"
          } else if (openaiError?.status === 429) {
            errorMessage = "OpenAI API rate limit exceeded. Please try again later."
          } else if (openaiError?.error?.message) {
            errorMessage = `OpenAI API error: ${openaiError.error.message}`
          }

          sendProgressEvent(encoder, controller, {
            type: "error",
            status: "error",
            progress: 50,
            message: errorMessage,
            error: errorMessage,
          })

          controller.close()
        }
      } catch (error) {
        console.error("[v0] Error generating images:", error)

        let errorMessage = "Failed to generate images"
        if (error instanceof SyntaxError) {
          errorMessage = "Invalid JSON in request body"
        } else if (error instanceof Error) {
          console.error("[v0] Error details:", error.message, error.stack)
          errorMessage = `Failed to generate images: ${error.message}`
        }

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
