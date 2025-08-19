export interface PromptPreset {
  id: string
  name: string
  description?: string
  template: string
}

// Presets are descriptive and avoid mimicking any single production's proprietary style.
export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "toon-paint-over-hybrid",
    name: "Toon Paint-Over (Hybrid)",
    description:
      "Paint over masked subject into a toon character while keeping scene realism outside the mask.",
    template:
      "Paint over the subject [[mask_data|if:in the masked region]] to transform them into a [[species|title]]-themed cartoon character while preserving the original pose, camera, and composition. Target blend [[blend_ratio]]% toon vs real. Preserve identity and wardrobe, converting materials to ink-and-paint equivalents. Add clean black line art with varied line weight, 2D cel shading with two-tone shadows and gentle rimlight, and subtle halftone in shadows. Style: [[body_style]]. World: [[world_type]]. Lighting: [[lighting]]. [[effects|prefix:Effects: ,true|join:, ]]. [[props_list|prefix:Props: ,true|join:, ]]. [[motion_lines|if:Include motion-line smears.]] [[custom_note]] Safe-for-work, family-friendly, non-violent.",
  },
  {
    id: "cartoons-in-live-action",
    name: "Cartoons in Live Action",
    description:
      "2D/2.5D cartoon characters composited into live-action without changing the real environment; style-mixed characters with realistic shadows and scene-matched lighting.",
    template:
  "4K HDR photo of a real-world environment, sharp detail. Keep the original background, camera, lens, and composition exactly intact; add only 2D/2.5D cartoon characters to the scene [[mask_data|if:, editing only the masked regions]]. Style mix across characters: rubber hose::2, anime::2, Flash::2, Saturday-morning cel::2 — each stays in its own style. Characters: bold black outlines; flat, saturated primary palette; cel shading with two-tone shadows; squash-and-stretch poses; optional rim light or toon-glow for emphasis; no reflections and no realistic textures. Integration: characters cast clean, soft, perspective-correct contact shadows on real ground/props. Contrast the realistic HDR lighting with the flat inked look. Subject: [[species|title]][[companion_summary|prefix:, with ,true]]. Primary toon style: [[body_style]]. Target blend [[blend_ratio]]% toon vs real for characters only; do not alter or stylize the background. Lighting: [[lighting]]. [[effects|prefix:Effects: ,true|join:, ]]. [[props_list|prefix:Props: ,true|join:, ]]. [[motion_lines|if:Include motion-line smears.]] Slight digital grain overlay for cohesion. [[custom_note]] Safe-for-work, family-friendly, non-violent.",
  },
  {
    id: "full-toon-world",
    name: "Full Toon World",
    description: "Transform subject and nearby scene into cohesive cartoon styling.",
    template:
      "Transform the subject and immediate surroundings into a cohesive [[body_style]] cartoon look while keeping recognizability. Emphasize bouncy line art, bold inking, cel shading with two-tone shadows, limited color palette, and matte paint textures. [[species|prefix:Species focus: ,true]]. Integrate with background per [[world_type]] setting and match Lighting: [[lighting]]. [[effects|prefix:Add: ,true|join:, ]]. [[props_list|prefix:Props: ,true|join:, ]]. [[motion_lines|if:Motion lines allowed.]] [[custom_note]] Safe-for-work, family-friendly, non-violent.",
  },
  {
    id: "subtle-cel-pass",
    name: "Subtle Cel Pass",
    description: "Light paint-over to suggest a toon without heavy stylization.",
    template:
      "Apply a subtle cel-shaded pass over the subject to suggest a [[species]] character while preserving photoreal facial features and identity. Use thin ink lines, soft two-tone shading, and a gentle matte paint texture; avoid over-smoothing or plasticity. Do not alter the background[[mask_data|if:, edit only the masked region]]. Keep composition, pose, and wardrobe. Lighting: [[lighting]]. [[effects|prefix:Optional effects: ,true|join:, ]]. [[custom_note]] Safe-for-work, family-friendly, non-violent.",
  },
]

export const DEFAULT_TOON_PRESET_ID = "cartoons-in-live-action"
