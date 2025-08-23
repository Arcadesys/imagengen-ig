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
  skinColor?: string // Add skin color support to animations
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
  const skinColor = (config.skinColor || "").trim()

  const styleDescriptor = getAnimationDescriptor(style)
  const speciesFeatures = generateSpeciesFeatures(species)
  const personalityFeatures = generatePersonalityFeatures(personality)
  const genderFeatures = gender ? `${gender} characteristics, ` : ""
  const colorFeatures = generateColorFeatures(skinColor, species)

  const instructions = [
    `Turn the subject into an ANIMATED character in the ${style} style (${styleDescriptor}).`,
    `Species: ${species} with ${genderFeatures}${speciesFeatures}.`,
    colorFeatures ? `Skin tone: ${colorFeatures}.` : "",
    `Personality cues: ${personalityFeatures}.`,
    // Identity preservation and caricature emphasis
    "CRITICAL: Preserve the subject's identity. Keep all distinctive facial features recognizable.",
    "CRITICAL: MAINTAIN EXACT ORIGINAL POSE, BODY POSITION, AND CAMERA ANGLE. Do not change the subject's posture, stance, arm positions, leg positions, or head orientation.",
    "CRITICAL: PRESERVE ORIGINAL FACIAL EXPRESSION AND EYE DIRECTION. Do not alter facial expressions, mouth position, eye gaze direction, or head tilt from the original.",
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
    cute: "sweet facial character, gentle qualities, endearing charm",
    goofy: "slightly silly facial character, whimsical charm, playful personality",
    funny: "comedic facial character, entertaining charm, witty personality",
    creepy: "mysterious facial character, intense character, unsettling charm",
    mischievous: "sly facial character, devilish charm, playful troublemaker personality",
    wise: "thoughtful facial character, knowing character, intelligent personality",
    grumpy: "stern facial character, serious character, gruff personality",
    cheerful: "bright facial character, happy personality, joyful charm",
    dramatic: "theatrical facial character, expressive personality, dramatic flair",
    shy: "bashful facial character, timid personality, modest charm",
    confident: "bold facial character, confident personality, charismatic charm",
    quirky: "unique facial character, eccentric personality, wonderfully weird charm",
  }
  if (!personality) return "natural personality expression"
  return map[personality] || "natural personality expression"
}

/**
 * Generate color features for skin tones in animation styles
 */
function generateColorFeatures(skinColor: string, species: string): string {
  if (!skinColor) return ""
  
  const colorLower = skinColor.toLowerCase()
  const speciesLower = species.toLowerCase()
  
  // For animated characters, we use appropriate terminology based on species
  let materialTerm = "skin"
  
  if (["cat", "dog", "wolf", "fox", "bear", "lion", "tiger"].includes(speciesLower)) {
    materialTerm = "fur"
  } else if (["dragon", "monster"].includes(speciesLower)) {
    materialTerm = "scales"
  } else if (speciesLower === "robot") {
    materialTerm = "metallic surface"
  } else if (speciesLower === "alien") {
    materialTerm = "skin"
  }
  
  // Color descriptions for animation
  const colorDescriptions: Record<string, string> = {
    // Natural human skin tones
    "light": `light ${materialTerm} tones`,
    "medium": `medium ${materialTerm} tones`,
    "dark": `dark ${materialTerm} tones`,
    "tan": `tan ${materialTerm}`,
    "olive": `olive-toned ${materialTerm}`,
    "pale": `pale ${materialTerm}`,
    "peachy": `peachy ${materialTerm}`,
    "golden": `golden ${materialTerm}`,
    "bronze": `bronze ${materialTerm}`,
    "ebony": `ebony ${materialTerm}`,
    "caramel": `caramel-toned ${materialTerm}`,
    "honey": `honey-colored ${materialTerm}`,
    "mahogany": `mahogany ${materialTerm}`,
    "amber": `amber-toned ${materialTerm}`,
    "sienna": `sienna ${materialTerm}`,
    
    // Classic colors for fantasy characters
    "white": `white ${materialTerm}`,
    "black": `black ${materialTerm}`,
    "gray": `gray ${materialTerm}`,
    "grey": `gray ${materialTerm}`,
    "brown": `brown ${materialTerm}`,
    
    // Vibrant animation colors
    "red": `red ${materialTerm}`,
    "blue": `blue ${materialTerm}`,
    "green": `green ${materialTerm}`,
    "yellow": `yellow ${materialTerm}`,
    "orange": `orange ${materialTerm}`,
    "purple": `purple ${materialTerm}`,
    "pink": `pink ${materialTerm}`,
    
    // Pastels and special colors
    "pastel pink": `soft pastel pink ${materialTerm}`,
    "pastel blue": `soft pastel blue ${materialTerm}`,
    "pastel green": `soft pastel green ${materialTerm}`,
    "pastel yellow": `soft pastel yellow ${materialTerm}`,
    "lavender": `lavender ${materialTerm}`,
    "mint": `mint green ${materialTerm}`,
    "cream": `cream-colored ${materialTerm}`,
    "silver": `silver ${materialTerm}`,
    "copper": `copper-colored ${materialTerm}`,
    
    // Fantasy colors for animation
    "emerald": `emerald green ${materialTerm}`,
    "sapphire": `sapphire blue ${materialTerm}`,
    "ruby": `ruby red ${materialTerm}`,
    "sunset": `sunset orange ${materialTerm}`,
    "forest": `forest green ${materialTerm}`,
    "ocean": `ocean blue ${materialTerm}`,
    "volcanic": `volcanic red ${materialTerm}`,
    "jade": `jade green ${materialTerm}`,
    "topaz": `topaz yellow ${materialTerm}`,
    "amethyst": `amethyst purple ${materialTerm}`,
    "turquoise": `turquoise ${materialTerm}`,
    "coral": `coral pink ${materialTerm}`,
    
    // Animated character specials
    "rainbow": `multicolored rainbow ${materialTerm}`,
    "iridescent": `iridescent shimmering ${materialTerm}`,
    "metallic": `metallic ${materialTerm}`,
    "neon": `bright neon ${materialTerm}`,
  }
  
  // Try to match the color description
  let colorDescription = colorDescriptions[colorLower]
  
  // If no exact match, create a basic description
  if (!colorDescription) {
    colorDescription = `${colorLower} ${materialTerm}`
  }
  
  return colorDescription
}
