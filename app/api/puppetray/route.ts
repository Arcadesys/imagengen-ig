import { NextResponse, type NextRequest } from "next/server"
import { sanitizePromptForImage } from "../../../lib/prompt-sanitizer"
import { checkPromptSafety } from "../../../lib/prompt-moderator"
import { ImageGenerationService } from "../../../lib/image-generation-service"

type Size = "512x512" | "768x768" | "1024x1024"

interface PuppetrayRequest {
  prompt?: string
  puppetStyle: "sock" | "muppet" | "mascot" | "felt" | "paper" | "plush"
  size?: Size
  n?: number
  seed?: string | number | null
  baseImageId?: string | null
  maskData?: string | null
}

/**
 * POST /api/puppetray
 * Always turns the masked subject (or subject) into a puppet, preserving the rest of the scene.
 * Style choices: sock, muppet, mascot, felt, paper, plush
 */
export async function POST(req: NextRequest) {
  try {
    const body: PuppetrayRequest = await req.json()
    const {
      prompt = "",
      puppetStyle,
      size = "512x512",
      n = 1,
      seed = null,
      baseImageId = null,
      maskData = null,
    } = body || ({} as any)

    if (!puppetStyle) {
      return NextResponse.json({ error: "puppetStyle is required" }, { status: 400 })
    }

    // Fail fast if provider credentials are missing
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    // Compose puppet-specific system prompt around user's prompt
    const puppetDescriptor =
      puppetStyle === "sock"
        ? "sock puppet: knitted texture, button eyes, stitched mouth, stretchy fabric"
        : puppetStyle === "muppet"
          ? "Muppet-style: foam head, felt skin, moveable mouth, ping-pong ball eyes, yarn hair"
          : puppetStyle === "mascot"
            ? "mascot costume: oversized foam head, bright fabric, visible stitching, sports team style"
            : puppetStyle === "felt"
              ? "felt puppet: wool felt texture, blanket-stitch seams, button eyes, embroidered mouth"
              : puppetStyle === "paper"
                ? "paper puppet: flat construction, cut edges, drawn features, craft project look"
                : "plush puppet: soft fleece fabric, embroidered features, toy store quality"

    const combined = [
      `Transform subject into ${puppetStyle} puppet (${puppetDescriptor}).`,
      "Replace all skin with fabric textures. Convert eyes to buttons/felt, hair to yarn/fabric.",
      "Keep exact pose, camera angle, background unchanged. Maintain identity but as puppet materials.",
      "Show realistic puppet construction: seams, stitching, fabric textures.",
      "Lighting matches original scene, puppet casts appropriate shadows.",
      prompt?.trim() ? `Subject details: ${prompt.trim()}.` : "",
      maskData ? "Apply only within mask area." : "",
      "Family-friendly content only.",
    ]
      .filter(Boolean)
      .join(" ")

    // Safety + sanitization
    const safety = checkPromptSafety(combined)
    if (!safety.allowed) {
      return NextResponse.json(
        { error: "Disallowed content.", reason: safety.reason },
        { status: 400 },
      )
    }
    const finalPrompt = sanitizePromptForImage(safety.cleaned ?? combined)

    // Call the image generation service directly to avoid internal fetch/network issues
    const imageService = new ImageGenerationService()
      const result = await imageService.generateImages(
        {
          prompt: finalPrompt,
          expandedPrompt: combined,
          size,
          n,
          seed,
          baseImageId,
          maskData,
        },
        req,
      )

    return NextResponse.json(result)
  } catch (e: any) {
    console.error("[puppetray] Error:", e)
    return NextResponse.json({ error: e?.message || "Failed to process puppetray request" }, { status: 500 })
  }
}
