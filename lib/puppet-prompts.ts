export type PuppetStyle = 
  // Classic Styles
  | "sock" | "muppet" | "felt" | "plush" | "paper"
  // Performance Styles  
  | "marionette" | "hand-puppet" | "rod-puppet" | "ventriloquist" | "bunraku"
  // Character Styles
  | "mascot" | "costume" | "fursuit" | "anime-mascot"
  // Material-Based
  | "wooden" | "plastic" | "clay" | "foam" | "latex"
  // Craft Styles
  | "finger-puppet" | "shadow-puppet" | "origami" | "balloon" | "cardboard"
  // Modern/Digital
  | "vtuber" | "cgi" | "pixel-art"
  // Cultural/Traditional
  | "punch-judy" | "wayang" | "kasperle" | "guignol"
  // Specialty/Artistic
  | "steampunk" | "gothic" | "cyberpunk" | "tribal" | "dia-de-muertos"
  // Fun/Quirky
  | "food" | "object" | "abstract" | "glitch" | "neon"

export interface PuppetConfiguration {
  style: PuppetStyle
  gender?: string
  species: string
  personality: string
}

/**
 * Generates a puppet transformation prompt based on the configuration
 */
export function generatePuppetPrompt(
  config: PuppetConfiguration,
  hasMask: boolean = false
): string {
  const { style, gender, species, personality } = config

  const puppetDescriptor = getPuppetDescriptor(style)

  // Build species characteristics
  const speciesFeatures = generateSpeciesFeatures(species)
  
  // Build personality characteristics
  const personalityFeatures = generatePersonalityFeatures(personality)
  
  // Build gender characteristics if specified
  const genderFeatures = gender ? `${gender} characteristics, ` : ""

  const transformationInstructions = [
    `Transform subject into ${style} puppet (${puppetDescriptor}) as a CARICATURE.`,
    `Species: ${species} with ${genderFeatures}${speciesFeatures}`,
    `Personality: ${personalityFeatures}`,
    "CRITICAL: PRESERVE ALL CLOTHING AND OUTFIT DETAILS. Maintain exact clothing items, patterns, colors, textures, logos, accessories, jewelry, and styling.",
    "Convert clothing materials to puppet-appropriate fabrics while keeping all design elements identical (same colors, patterns, cuts, fit).",
    "Preserve outfit completely: shirts, pants, dresses, jackets, shoes, hats, glasses, jewelry - everything must remain recognizable but in puppet materials.",
    "CARICATURE STYLE: Exaggerate and emphasize the subject's most distinctive facial features while maintaining their recognizable identity.",
    "Amplify unique characteristics: prominent nose, distinctive eyebrows, facial structure, expression, hair style.",
    "Keep their essential likeness but with playful, exaggerated proportions typical of caricature art.",
    "Replace all skin with fabric textures. Convert eyes to buttons/felt, hair to yarn/fabric.",
    "Maintain caricature proportions: larger head, expressive features, characteristic details.",
    "Keep exact pose, camera angle, background unchanged. Preserve identity through caricature puppet materials.",
    "Show realistic puppet construction: seams, stitching, fabric textures with caricature proportions.",
    "Lighting matches original scene, puppet casts appropriate shadows.",
    hasMask ? "Apply only within mask area." : "",
    "Family-friendly content only.",
  ]
    .filter(Boolean)
    .join(" ")

  return transformationInstructions
}

/**
 * Get the descriptive text for each puppet style
 */
function getPuppetDescriptor(style: PuppetStyle): string {
  const descriptors: Record<PuppetStyle, string> = {
    // Classic Styles
    "sock": "sock puppet: knitted texture, button eyes, stitched mouth, stretchy fabric",
    "muppet": "Muppet-style: foam head, felt skin, moveable mouth, ping-pong ball eyes, yarn hair",
    "felt": "felt puppet: wool felt texture, blanket-stitch seams, button eyes, embroidered mouth",
    "plush": "plush puppet: soft fleece fabric, embroidered features, toy store quality",
    "paper": "paper puppet: flat construction, cut edges, drawn features, craft project look",
    
    // Performance Styles
    "marionette": "marionette: wooden body with strings, articulated joints, hand-carved features",
    "hand-puppet": "hand puppet: fabric glove design, large mouth opening, expressive features",
    "rod-puppet": "rod puppet: controlled by rods, large scale, theatrical design",
    "ventriloquist": "ventriloquist dummy: wooden construction, moving jaw, glass eyes, formal attire",
    "bunraku": "bunraku puppet: traditional Japanese, elaborate costume, multiple operators",
    
    // Character Styles
    "mascot": "mascot costume: oversized foam head, bright fabric, visible stitching, sports team style",
    "costume": "full body costume: complete character suit, padded construction, character mask",
    "fursuit": "fursuit: anthropomorphic animal costume, faux fur, expressive face, paws",
    "anime-mascot": "anime mascot: kawaii style, large eyes, colorful design, Japanese character aesthetic",
    
    // Material-Based
    "wooden": "wooden puppet: hand-carved wood, visible grain, articulated joints, painted details",
    "plastic": "plastic figure: molded construction, smooth finish, action figure joints, bright colors",
    "clay": "clay puppet: plasticine texture, malleable appearance, stop-motion animation style",
    "foam": "foam puppet: dense foam core, fabric covering, lightweight construction, hand manipulation",
    "latex": "latex prosthetic: realistic skin texture, detailed sculpting, movie-quality effects",
    
    // Craft Styles
    "finger-puppet": "finger puppet: tiny scale, simple construction, basic features, finger-sized",
    "shadow-puppet": "shadow puppet: flat silhouette, intricate cutouts, traditional shadow play style",
    "origami": "origami puppet: folded paper construction, geometric angles, Japanese paper-folding art",
    "balloon": "balloon animal: twisted balloon sculpture, bright colors, inflated segments",
    "cardboard": "cardboard puppet: corrugated construction, visible edges, craft project aesthetic",
    
    // Modern/Digital
    "vtuber": "VTuber avatar: anime-style digital character, virtual streamer aesthetic, kawaii features",
    "cgi": "CGI character: 3D computer animation style, smooth surfaces, digital rendering",
    "pixel-art": "pixel art character: retro 8-bit style, blocky construction, video game aesthetic",
    
    // Cultural/Traditional
    "punch-judy": "Punch and Judy puppet: traditional English style, exaggerated features, theatrical design",
    "wayang": "wayang puppet: Indonesian shadow puppet, intricate leather work, traditional patterns",
    "kasperle": "Kasperle puppet: German hand puppet, pointed cap, traditional European design",
    "guignol": "Guignol puppet: French puppet theater style, expressive features, period costume",
    
    // Specialty/Artistic
    "steampunk": "steampunk puppet: Victorian mechanical style, brass gears, clockwork elements, vintage aesthetic",
    "gothic": "gothic puppet: dark romantic style, lace details, velvet textures, mysterious atmosphere",
    "cyberpunk": "cyberpunk puppet: futuristic design, neon accents, chrome details, high-tech aesthetic",
    "tribal": "tribal mask puppet: ceremonial design, traditional patterns, cultural symbolism",
    "dia-de-muertos": "Día de Muertos puppet: sugar skull design, colorful decorations, Mexican folk art",
    
    // Fun/Quirky
    "food": "food puppet: designed as edible items, kitchen aesthetic, culinary theme",
    "object": "object puppet: everyday items given life, household objects, creative repurposing",
    "abstract": "abstract art puppet: non-representational design, artistic shapes, conceptual form",
    "glitch": "glitch art puppet: digital corruption aesthetic, pixelated errors, tech malfunction style",
    "neon": "neon puppet: bright fluorescent colors, glowing appearance, electric aesthetic"
  }
  
  return descriptors[style] || "unique puppet design"
}

/**
 * Generate species-specific features
 */
function generateSpeciesFeatures(species: string): string {
  const speciesLower = species.toLowerCase()
  
  // Base features for different species categories
  const speciesFeatureMap: Record<string, { ears?: string, nose?: string, tail?: string, skin?: string, eyes?: string, extras?: string }> = {
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
    robot: { ears: "mechanical parts", nose: "robotic features", skin: "metallic panels", eyes: "LED eyes", extras: "visible circuits" }
  }

  // Find matching species or use generic monster features
  const features = speciesFeatureMap[speciesLower] || speciesFeatureMap.monster

  const allFeatures = [
    features.ears || `${speciesLower} ears`,
    features.nose || `${speciesLower} nose`,
    features.tail || `${speciesLower} tail`,
    features.skin || `${speciesLower} markings`,
    features.eyes || `${speciesLower} eyes`,
    features.extras
  ].filter(Boolean)
  
  return allFeatures.join(", ")
}

/**
 * Generate personality-specific features and expressions
 */
function generatePersonalityFeatures(personality: string): string {
  const personalityMap: Record<string, string> = {
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
    quirky: "unique expression, eccentric features, whimsical details, wonderfully weird charm"
  }

  return personalityMap[personality] || "expressive features"
}
