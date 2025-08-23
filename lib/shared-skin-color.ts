/**
 * Shared skin color configuration for all generators
 * This provides a consistent way to handle skin color across puppet, animation, and other generators
 */

export interface SkinColorOption {
  value: string
  label: string
}

/**
 * Standard skin color options used across all generators
 * Organized to prioritize diverse representation and counteract white-first biases
 */
export const SKIN_COLOR_OPTIONS: SkinColorOption[] = [
  // Start with "Default" but don't make it first to avoid white-first bias
  { value: '', label: 'Default (original skin tone)' },
  
  // Diverse natural skin tones first
  { value: 'dark', label: 'Dark' },
  { value: 'medium', label: 'Medium' },
  { value: 'tan', label: 'Tan' },
  { value: 'olive', label: 'Olive' },
  { value: 'light', label: 'Light' },
  { value: 'pale', label: 'Pale' },
  { value: 'peachy', label: 'Peachy' },
  
  // Classic colors
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'gray', label: 'Gray' },
  
  // Vibrant colors
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  
  // Pastel colors
  { value: 'pastel pink', label: 'Pastel Pink' },
  { value: 'pastel blue', label: 'Pastel Blue' },
  { value: 'lavender', label: 'Lavender' },
  { value: 'mint', label: 'Mint Green' },
  { value: 'cream', label: 'Cream' },
  
  // Special colors
  { value: 'golden', label: 'Golden' },
  { value: 'silver', label: 'Silver' },
  { value: 'rainbow', label: 'Rainbow' }
]

/**
 * Generate a skin color question configuration for any generator
 */
export function createSkinColorQuestion(customText?: string) {
  return {
    id: 'skinColor',
    text: customText || 'What skin color should the character have?',
    type: 'select',
    options: SKIN_COLOR_OPTIONS
  }
}

/**
 * Generate color description text for prompts based on the material context
 * This is a general version that can be used by any generator
 */
export function generateColorDescription(
  skinColor: string, 
  materialContext: 'human' | 'puppet' | 'animation' | 'general' = 'general'
): string {
  if (!skinColor) return ""
  
  const colorLower = skinColor.toLowerCase()
  
  // Determine appropriate material terms based on context
  let materialTerm = "skin"
  let materialQualifier = ""
  
  switch (materialContext) {
    case 'puppet':
      materialTerm = "material"
      materialQualifier = "puppet "
      break
    case 'animation':
      materialTerm = "coloring"
      materialQualifier = "character "
      break
    case 'human':
      materialTerm = "skin tone"
      materialQualifier = ""
      break
    case 'general':
    default:
      materialTerm = "coloring"
      materialQualifier = ""
      break
  }
  
  // Color descriptions that work well across different contexts
  const colorDescriptions: Record<string, string> = {
    // Natural skin tones
    "light": `light ${materialQualifier}${materialTerm}`,
    "medium": `medium ${materialQualifier}${materialTerm}`,
    "dark": `dark ${materialQualifier}${materialTerm}`,
    "tan": `tan ${materialQualifier}${materialTerm}`,
    "olive": `olive-toned ${materialQualifier}${materialTerm}`,
    "pale": `pale ${materialQualifier}${materialTerm}`,
    "peachy": `peachy ${materialQualifier}${materialTerm}`,
    
    // Classic colors
    "white": `white ${materialQualifier}${materialTerm}`,
    "black": `black ${materialQualifier}${materialTerm}`,
    "gray": `gray ${materialQualifier}${materialTerm}`,
    "grey": `gray ${materialQualifier}${materialTerm}`,
    "brown": `brown ${materialQualifier}${materialTerm}`,
    
    // Vibrant colors
    "red": `red ${materialQualifier}${materialTerm}`,
    "blue": `blue ${materialQualifier}${materialTerm}`,
    "green": `green ${materialQualifier}${materialTerm}`,
    "yellow": `yellow ${materialQualifier}${materialTerm}`,
    "orange": `orange ${materialQualifier}${materialTerm}`,
    "purple": `purple ${materialQualifier}${materialTerm}`,
    "pink": `pink ${materialQualifier}${materialTerm}`,
    
    // Pastel colors
    "pastel pink": `soft pastel pink ${materialQualifier}${materialTerm}`,
    "pastel blue": `soft pastel blue ${materialQualifier}${materialTerm}`,
    "pastel green": `soft pastel green ${materialQualifier}${materialTerm}`,
    "pastel yellow": `soft pastel yellow ${materialQualifier}${materialTerm}`,
    "lavender": `lavender ${materialQualifier}${materialTerm}`,
    "mint": `mint green ${materialQualifier}${materialTerm}`,
    "cream": `cream-colored ${materialQualifier}${materialTerm}`,
    
    // Animal-inspired colors
    "golden": `golden ${materialQualifier}${materialTerm}`,
    "silver": `silver ${materialQualifier}${materialTerm}`,
    "copper": `copper-colored ${materialQualifier}${materialTerm}`,
    "bronze": `bronze ${materialQualifier}${materialTerm}`,
    
    // Fantasy colors
    "rainbow": `multicolored rainbow ${materialQualifier}${materialTerm}`,
    "iridescent": `iridescent shimmering ${materialQualifier}${materialTerm}`,
    "metallic": `metallic ${materialQualifier}${materialTerm}`,
    "neon": `bright neon ${materialQualifier}${materialTerm}`,
  }
  
  // Try to match the color description
  let colorDescription = colorDescriptions[colorLower]
  
  // If no exact match, create a basic description
  if (!colorDescription) {
    colorDescription = `${colorLower} ${materialQualifier}${materialTerm}`
  }
  
  return colorDescription
}