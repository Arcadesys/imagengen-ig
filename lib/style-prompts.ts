// Detailed, provider-friendly prompts for the styles exposed by /api/questions
// Avoids directly mimicking any single production’s proprietary style.

export type StyleId = "cartoon" | "anime" | "pixar" | "watercolor" | "comic" | "vintage"

const STYLE_PROMPTS: Record<StyleId, string> = {
  cartoon:
    [
      "Repaint the photographed subject into a friendly, family-safe cartoon while preserving facial identity, pose, lens and composition.",
      "Use bold, clean black outlines with varied line weight; flat, saturated colors; simple cel shading (two-tone shadows plus soft rim light).",
      "Keep background structure recognizable; smooth noisy textures; avoid text, logos, or brand marks.",
      "Gentle contrast, slight glow for highlights; soft vignette. No violent or suggestive content.",
    ].join(" "),
  anime:
    [
      "Transform the subject into an anime-inspired portrait while keeping the person recognizable and the camera framing intact.",
      "Clean line art, expressive eyes with subtle specular highlights, small nose and mouth, limited color palette, cel shading with clear shadow shapes.",
      "Hair with tapered ink lines and layered strands; ambient rim light; background simplified into soft shapes.",
      "No text, signature, or captions. Safe-for-work, friendly tone.",
    ].join(" "),
  pixar:
    [
      "Convert the subject into a stylized 3D animated film look while preserving identity and clothing silhouettes; keep the original composition.",
      "Soft, physically based materials; gentle subsurface scattering on skin; large readable shapes; tidy edge highlights.",
      "Studio key light with soft fill and subtle rim; shallow depth of field; warm, optimistic color grading.",
      "No logos or text. Wholesome and family-friendly.",
    ].join(" "),
  watercolor:
    [
      "Interpret the subject as a watercolor painting while maintaining likeness and pose.",
      "Translucent pigment washes, soft edges that bloom into paper texture, granulation in darker passages, reserved hard edges on focal features.",
      "Limited palette with harmonious hues; visible brushwork; light splatter accents; white of paper for highlights.",
      "No handwriting or captions.",
    ].join(" "),
  comic:
    [
      "Render the subject as a comic-book illustration that preserves identity and camera composition.",
      "Bold inking with confident contour lines, cross-hatching or halftone in shadows, flat colors with punchy complementary accents.",
      "Optional speed lines or action bursts behind the subject; high clarity; dramatic but clean lighting.",
      "Exclude speech bubbles, captions, or text; no brand marks.",
    ].join(" "),
  vintage:
    [
      "Create a classic mid-20th-century portrait photograph feel while keeping the subject recognizable.",
      "Subtle film grain, gentle halation, soft vignette, slightly warm toning (sepia or silver gelatin feel).",
      "Directional key light with soft falloff; period-appropriate contrast; shallow depth of field.",
      "No visible text or watermarks.",
    ].join(" "),
}

export function getDetailedStylePrompt(styleId?: string | null): string {
  if (!styleId) return STYLE_PROMPTS.cartoon
  const key = styleId as StyleId
  return (STYLE_PROMPTS[key] ?? STYLE_PROMPTS.cartoon) as string
}
