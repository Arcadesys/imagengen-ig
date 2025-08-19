import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET() {
  try {
    console.log("[v0] Questions API called")

    // Primary: return styles and generation steps used by the new UI
    const styles = [
      {
        id: "cartoon",
        name: "Cartoon",
        description: "Transform into a fun cartoon character",
        prompt: "cartoon style, animated, colorful, playful",
        preview: "/ai-cartoon-photo.png",
      },
      {
        id: "anime",
        name: "Anime",
        description: "Become an anime character with big expressive eyes",
        prompt: "anime style, manga, Japanese animation, detailed",
        preview: "/ai-anime-style-photo.png",
      },
      {
        id: "pixar",
        name: "Pixar",
        description: "3D animated movie character style",
        prompt: "pixar style, 3D animated, disney pixar, rendered",
        preview: "/ai-pixar-style.png",
      },
      {
        id: "watercolor",
        name: "Watercolor",
        description: "Soft watercolor painting effect",
        prompt: "watercolor painting, soft brushstrokes, artistic",
        preview: "/ai-watercolor-photo.png",
      },
      {
        id: "comic",
        name: "Comic Book",
        description: "Bold comic book superhero style",
        prompt: "comic book style, bold lines, pop art, superhero",
        preview: "/ai-comic-style-photo.png",
      },
      {
        id: "vintage",
        name: "Vintage",
        description: "Classic vintage portrait style",
        prompt: "vintage style, retro, classic photography, sepia tones",
        preview: "/ai-vintage-photo.png",
      },
    ]

    const generationSteps = [
      { id: "analyze", name: "Analyzing Photo", description: "Understanding your image composition", duration: 2000 },
      { id: "style", name: "Applying Style", description: "Transforming with AI magic", duration: 3000 },
      { id: "enhance", name: "Enhancing Details", description: "Adding finishing touches", duration: 2000 },
      { id: "finalize", name: "Finalizing", description: "Preparing your masterpiece", duration: 1000 },
    ]

    // Back-compat: also expose photobooth question schema from data/questions.json if present
    // Some pages may expect the full schema; consumers can ignore it if not needed.
    let schema: any = null
    try {
      const p = path.join(process.cwd(), "data", "questions.json")
      const s = await readFile(p, "utf8")
      schema = JSON.parse(s)
    } catch {}

    return NextResponse.json({ success: true, styles, generationSteps, totalStyles: styles.length, schema })
  } catch (error) {
    console.error("[v0] Questions API error:", error)
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 })
  }
}
