export type AnimationStyle =
  | "anime"
  | "manga"
  | "rubber-hose"
  | "western-cel"
  | "vector-flat"
  | "paper-cutout"
  | "stop-motion"
  | "cg-toon"
  | "toon-shaded-3d"
  | "watercolor"
  | "comic-book"
  | "pixel-art"
  | "noir-ink"
  | "chalk-crayon"
  | "graffiti"
  | "sketch"
  | "retro-80s"
  | "saturday-morning"

export interface AnimationConfiguration {
  style: AnimationStyle
  gender?: string
  species?: string
  personality?: string
}

/**
 * Generates a toon transformation prompt based on the configuration.
 * Has similar structure to puppet prompts but tailored for animation styles.
 */
export function generateAnimationPrompt(
  config: AnimationConfiguration,
  hasMask: boolean = false
): string {
  const style = config.style
  const gender = (config.gender || "").trim()
  const species = (config.species || "human").trim() || "human"
  const personality = (config.personality || "").trim()

  const styleDescriptor = getAnimationDescriptor(style)
  const speciesFeatures = generateSpeciesFeatures(species)
  const personalityFeatures = generatePersonalityFeatures(personality)
  const genderFeatures = gender ? `${gender} characteristics, ` : ""

  const instructions = [
    `Turn the subject into an ANIMATED character in the ${style} style (${styleDescriptor}).`,
    `Species: ${species} with ${genderFeatures}${speciesFeatures}.`,
    `Personality cues: ${personalityFeatures}.`,
    // Identity preservation and caricature emphasis
    "CRITICAL: Preserve the subject's identity. Keep all distinctive facial features recognizable.",
    "Use caricature principles: exaggerate distinctive features (nose, eyebrows, facial structure) while maintaining likeness.",
    // Rendering guidance typical for cartoon integration
    "Bold outlines where appropriate, clean shapes, and consistent shading per the chosen animation style.",
    "Maintain original camera, lens, composition, pose, and background. Do not alter the environment.",
    "Cast appropriate contact shadows consistent with the scene lighting for cohesive integration.",
    hasMask ? "Edit only inside the painted mask area; leave all unmasked regions untouched." : "",
    // Safety
    "Family-friendly, safe-for-work.",
  ]
    .filter(Boolean)
    .join(" ")

  return instructions
}

function getAnimationDescriptor(style: AnimationStyle): string {
  const map: Record<AnimationStyle, string> = {
    "anime": "2D anime aesthetics: clean line art, cel shading, expressive eyes, limited palette",
    "manga": "black-and-white with screentones, dynamic linework, speed lines where appropriate",
    "rubber-hose": "1920s rubber-hose: noodle limbs, simple pie-cut eyes, vintage ink style",
    "western-cel": "Saturday-morning cel: flat colors, thick outlines, simple geometric forms",
    "vector-flat": "vector/Flash-style: flat fills, sharp bezier curves, minimal shading",
    "paper-cutout": "paper cutout: layered paper textures, hard cut edges, slight drop shadows",
    "stop-motion": "stop-motion look: slight imperfections, handmade textures, subtle frame stutter",
    "cg-toon": "CG toon: 3D character with non-photoreal toon shaders, clean ramp lighting",
    "toon-shaded-3d": "3D with toon shading: quantized lighting bands, ink outlines",
    "watercolor": "watercolor illustration: soft washes, pigment blooms, paper texture",
    "comic-book": "comic book halftone: inked outlines, Ben-Day dots/halftone shading, caption vibe",
    "pixel-art": "pixel art: low-resolution mosaic, limited palette, crisp pixel clusters",
    "noir-ink": "noir ink: high-contrast black ink, dramatic chiaroscuro, heavy shadows",
    "chalk-crayon": "chalk/crayon: waxy strokes, visible grain, childlike texture",
    "graffiti": "street art graffiti: bold strokes, spray textures, vibrant colors",
    "sketch": "pencil sketch: graphite lines, crosshatching, paper grain",
    "retro-80s": "retro 80s animation: saturated primaries, airbrush highlights, VHS vibe",
    "saturday-morning": "classic TV cartoon: bright colors, limited animation cues, playful shapes",
  }
  return map[style]
}

// The following helpers parallel the puppet prompt helpers for consistency
function generateSpeciesFeatures(species: string): string {
  const s = species.toLowerCase()
  const map: Record<string, { ears?: string; nose?: string; tail?: string; skin?: string; eyes?: string; extras?: string }> = {
    cat: { ears: "pointed cat ears", nose: "small pink nose", tail: "cat tail", skin: "fur patterns", eyes: "cat-like eyes" },
    dog: { ears: "floppy dog ears", nose: "wet black nose", tail: "wagging dog tail", skin: "fur markings", eyes: "loyal dog eyes" },
    wolf: { ears: "pointed wolf ears", nose: "wolf snout", tail: "bushy wolf tail", skin: "gray fur", eyes: "piercing wolf eyes" },
    fox: { ears: "pointed fox ears", nose: "black fox nose", tail: "fluffy fox tail", skin: "orange fur with white", eyes: "clever fox eyes" },
    bear: { ears: "round bear ears", nose: "bear snout", tail: "short bear tail", skin: "thick fur", eyes: "gentle bear eyes" },
    lion: { ears: "lion ears", nose: "lion nose", tail: "lion tail with tuft", skin: "golden mane", eyes: "fierce lion eyes" },
    tiger: { ears: "tiger ears", nose: "tiger nose", tail: "striped tiger tail", skin: "orange with black stripes", eyes: "tiger eyes" },
    dragon: { ears: "dragon horns", nose: "dragon snout", tail: "long dragon tail", skin: "scales", eyes: "dragon eyes", extras: "small wings" },
    monster: { ears: "monster ears", nose: "monster features", tail: "monster tail", skin: "textured monster skin", eyes: "monster eyes" },
    alien: { ears: "alien features", nose: "alien nose", skin: "alien skin texture", eyes: "large alien eyes", extras: "alien markings" },
    robot: { ears: "mechanical parts", nose: "robotic features", skin: "metallic panels", eyes: "LED eyes", extras: "visible circuits" },
    human: { ears: "human ear placement", nose: "human nose", tail: "no tail", skin: "human skin tones", eyes: "human eyes" },
  }
  const f = map[s] || map.human
  const parts = [f.ears || `${s} ears`, f.nose || `${s} nose`, f.tail || `${s} tail`, f.skin || `${s} markings`, f.eyes || `${s} eyes`, f.extras]
  return parts.filter(Boolean).join(", ")
}

function generatePersonalityFeatures(personality: string): string {
  const map: Record<string, string> = {
    cute: "sweet expression, big innocent eyes, soft features, endearing smile",
    goofy: "silly expression, crossed eyes, lopsided grin, playful pose",
    funny: "comedic expression, raised eyebrows, witty smirk, entertaining demeanor",
    creepy: "mysterious expression, intense stare, shadowy features, unsettling grin",
    mischievous: "sly expression, winking eye, devilish grin, playful troublemaker look",
    wise: "thoughtful expression, knowing eyes, gentle smile, intelligent demeanor",
    grumpy: "frowning expression, furrowed brow, crossed arms, serious scowl",
    cheerful: "bright expression, big smile, sparkling eyes, happy demeanor",
    dramatic: "theatrical expression, exaggerated features, dramatic pose, expressive gestures",
    shy: "bashful expression, blushing cheeks, timid smile, modest pose",
    confident: "bold expression, confident smile, strong posture, charismatic presence",
    quirky: "unique expression, eccentric features, whimsical details, wonderfully weird charm",
  }
  if (!personality) return "expressive features"
  return map[personality] || "expressive features"
}
