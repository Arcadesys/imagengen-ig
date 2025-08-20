import { NextResponse, type NextRequest } from "next/server"
import { sanitizePromptForImage } from "../../../lib/prompt-sanitizer"
import { checkPromptSafety } from "../../../lib/prompt-moderator"

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

    // Compose puppet-specific system prompt around user's prompt
    const puppetDescriptor =
      puppetStyle === "sock"
        ? "sock puppet with knitted texture, button-like eyes, stitched mouth"
        : puppetStyle === "muppet"
          ? "hand-operated foam-and-felt puppet with expressive mouth plate, felt skin, yarn or felt hair"
          : puppetStyle === "mascot"
            ? "large foam mascot costume with oversized head, fabric surface, visible stitching"
            : puppetStyle === "felt"
              ? "felt-and-foam puppet, visible seams, matte fibers, simple plastic eyes"
              : puppetStyle === "paper"
                ? "flat paper puppet with cut-edge outlines, slight paper texture"
                : "plush toy puppet with soft pile fabric and embroidered features"

    const baseInstruction =
      "Convert the subject into a puppet version while preserving pose, camera, composition, and background. Maintain subject identity features (face structure, hair style, glasses, facial hair, clothing patterns/logo placements) translated into puppet materials."
    const integrationNotes =
      "Do not change the real environment (background/scene remains real). Use scene-matched lighting and cast plausible contact shadows from the puppet onto nearby surfaces. Keep a clean digital look; avoid glossy CGI."
    const materialNotes =
      "Materials: fabric, felt, foam, thread, embroidery. Avoid human skin texture; replace with fabric surface and stitched seams."

    const combined = [
      baseInstruction,
      `Puppet style: ${puppetStyle} (${puppetDescriptor}).`,
      integrationNotes,
      materialNotes,
      prompt?.trim() ? `Subject detail: ${prompt.trim()}.` : "",
      maskData ? "Apply only within the provided mask; do not alter outside the mask." : "",
      "Safe-for-work, family-friendly, non-violent.",
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

    // Hand off to existing generator (non-stream) for simplicity
  const genRes = await fetch(new URL("/api/images/generate", req.nextUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt,
        expandedPrompt: combined,
        size,
    n,
        seed,
        baseImageId,
        maskData,
      }),
    })

    if (!genRes.ok) {
      const errText = await genRes.text().catch(() => "")
      let errMsg = "Generation failed"
      try {
        const j = JSON.parse(errText)
        errMsg = j.error || errMsg
      } catch {
        if (errText) errMsg = `${errMsg}: ${errText.slice(0, 200)}`
      }
      return NextResponse.json({ error: errMsg }, { status: genRes.status })
    }

    const data = await genRes.json()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error("[puppetray] Error:", e)
    return NextResponse.json({ error: e?.message || "Failed to process puppetray request" }, { status: 500 })
  }
}
