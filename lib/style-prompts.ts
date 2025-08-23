// Detailed, provider-friendly prompts for the styles exposed by /api/questions
// Avoids directly mimicking any single production’s proprietary style.
import { generateColorDescription } from "./shared-skin-color"

export type StyleId = "cartoon" | "anime" | "pixar" | "watercolor" | "comic" | "vintage"

export interface StyleConfiguration {
  skinColor?: string
  [key: string]: any
}

const STYLE_PROMPTS: Record<StyleId, string> = {
  cartoon:
    [
      "Create a CARICATURE of the photographed subject as a friendly, family-safe cartoon while preserving facial identity, pose, lens and composition.",
      "CARICATURE STYLE: Exaggerate the subject's most distinctive facial features (nose, eyebrows, facial structure, expression) while maintaining recognizable identity.",
      "Use bold, clean black outlines with varied line weight; flat, saturated colors; simple cel shading (two-tone shadows plus soft rim light).",
      "Amplify characteristic proportions in a playful, exaggerated way typical of caricature art.",
      "PRESERVE ALL CLOTHING: Keep exact clothing items, colors, patterns, textures, and styling while converting to cartoon materials.",
      "Keep background structure recognizable; smooth noisy textures; avoid text, logos, or brand marks.",
      "Gentle contrast, slight glow for highlights; soft vignette. No violent or suggestive content.",
    ].join(" "),
  anime:
    [
      "Transform the subject into an anime-inspired CARICATURE portrait while keeping the person recognizable and the camera framing intact.",
      "CARICATURE APPROACH: Emphasize their unique features through anime styling - distinctive eye shape, nose, facial structure, hair style.",
      "Clean line art, expressive eyes with subtle specular highlights, small nose and mouth, limited color palette, cel shading with clear shadow shapes.",
      "Exaggerate characteristic features in anime style while preserving essential likeness.",
      "PRESERVE ALL CLOTHING: Keep exact clothing items, colors, patterns, textures, and styling while converting to anime art style.",
      "Hair with tapered ink lines and layered strands; ambient rim light; background simplified into soft shapes.",
      "No text, signature, or captions. Safe-for-work, friendly tone.",
    ].join(" "),
  pixar:
    [
      "Convert the subject into a stylized 3D animated CARICATURE with film-quality look while preserving identity and clothing silhouettes; keep the original composition.",
      "CARICATURE PRINCIPLES: Amplify distinctive facial characteristics with Pixar's signature exaggerated proportions and expressions.",
      "Soft, physically based materials; gentle subsurface scattering on skin; large readable shapes; tidy edge highlights.",
      "Emphasize unique features through stylized 3D forms - larger head, expressive eyes, characteristic details.",
      "Studio key light with soft fill and subtle rim; shallow depth of field; warm, optimistic color grading.",
      "No logos or text. Wholesome and family-friendly.",
    ].join(" "),
  watercolor:
    [
      "Interpret the subject as a watercolor painting CARICATURE while maintaining likeness and pose.",
      "CARICATURE TECHNIQUE: Emphasize distinctive features through watercolor's natural exaggeration - flowing lines that accentuate unique characteristics.",
      "Translucent pigment washes, soft edges that bloom into paper texture, granulation in darker passages, reserved hard edges on focal features.",
      "Use watercolor's fluid nature to playfully exaggerate prominent nose, eyebrows, facial structure, expression.",
      "PRESERVE ALL CLOTHING: Keep exact clothing items, colors, patterns, and styling while converting to watercolor paint effects.",
      "Limited palette with harmonious hues; visible brushwork; light splatter accents; white of paper for highlights.",
      "No handwriting or captions.",
    ].join(" "),
  comic:
    [
      "Render the subject as a comic-book illustration CARICATURE that preserves identity and camera composition.",
      "CARICATURE STYLE: Amplify distinctive features with comic book's bold, exaggerated aesthetic - prominent characteristics drawn larger than life.",
      "Bold inking with confident contour lines, cross-hatching or halftone in shadows, flat colors with punchy complementary accents.",
      "Emphasize unique facial features through comic styling - expressive lines that highlight individual characteristics.",
      "PRESERVE ALL CLOTHING: Keep exact clothing items, colors, patterns, and styling while converting to comic book art style.",
      "Optional speed lines or action bursts behind the subject; high clarity; dramatic but clean lighting.",
      "Exclude speech bubbles, captions, or text; no brand marks.",
    ].join(" "),
  vintage:
    [
      "Create a classic mid-20th-century portrait photograph with subtle CARICATURE feel while keeping the subject recognizable.",
      "CARICATURE APPROACH: Gentle emphasis on distinctive features through vintage photography's natural character enhancement.",
      "Subtle film grain, gentle halation, soft vignette, slightly warm toning (sepia or silver gelatin feel).",
      "Use period-appropriate lighting to naturally emphasize the subject's unique facial characteristics.",
      "PRESERVE ALL CLOTHING: Keep exact clothing items, colors, patterns, and styling while applying vintage photographic effects.",
      "Directional key light with soft falloff; period-appropriate contrast; shallow depth of field.",
      "No visible text or watermarks.",
    ].join(" "),
}

export function getDetailedStylePrompt(styleId?: string | null, config?: StyleConfiguration): string {
  if (!styleId) styleId = 'cartoon'
  const key = styleId as StyleId
  let prompt = STYLE_PROMPTS[key] ?? STYLE_PROMPTS.cartoon
  
  // Add skin color information if provided
  if (config?.skinColor) {
    const colorDescription = generateColorDescription(config.skinColor, 'human')
    if (colorDescription) {
      prompt += ` Apply ${colorDescription} to all visible skin areas while maintaining the artistic style.`
    }
  }
  
  return prompt
}
