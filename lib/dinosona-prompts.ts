/**
 * Dinosona prompt generation with skin color support
 * Handles transformation into dinosaur personas while preserving identity
 */

import { generateColorDescription } from "./shared-skin-color"

export interface DinosonaConfiguration {
  dinosaur?: string
  gender?: string
  skinColor?: string
  [key: string]: any
}

/**
 * Generate a dinosona transformation prompt based on configuration
 */
export function generateDinosonaPrompt(config: DinosonaConfiguration): string {
  const dinosaur = (config.dinosaur || "friendly dinosaur").trim()
  const gender = (config.gender || "").trim()
  const skinColor = (config.skinColor || "").trim()
  
  // Generate skin/scale color features for dinosaur context
  const colorFeatures = generateColorDescription(skinColor, 'general')
  
  const instructions = [
    `Transform the person in the photo into a friendly dinosona character.`,
    `Species: ${dinosaur}.`,
    gender ? `Gender: ${gender}.` : "",
    colorFeatures ? `Skin/scale coloring: ${colorFeatures}.` : "",
    "CRITICAL: Preserve facial likeness and identity while translating features into dinosaur anatomy.",
    "CRITICAL: MAINTAIN EXACT ORIGINAL POSE, BODY POSITION, AND CAMERA ANGLE.",
    "CRITICAL: PRESERVE ORIGINAL FACIAL EXPRESSION AND EYE DIRECTION.",
    "Transform human features into appropriate dinosaur characteristics while keeping the person recognizable.",
    colorFeatures ? `Apply ${colorFeatures} to all visible skin and scale areas.` : "",
    "Use caricature principles to emphasize distinctive facial features in dinosaur form.",
    "Maintain original camera, lens, composition, and background unchanged.",
    "Cast appropriate shadows for scene integration.",
    "Cute, family-friendly, highly detailed, studio-quality illustration.",
    "Safe-for-work content only.",
  ]
    .filter(Boolean)
    .join(" ")

  return instructions
}