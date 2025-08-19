/**
 * sanitizePromptForImage
 *
 * Cleans up human-readable, sectioned prompts (e.g., "Style: X. Lighting: Y.")
 * into a single descriptive sentence better suited for image models.
 * Also appends a short guard against text artifacts.
 */
export function sanitizePromptForImage(raw: string): string {
  if (!raw) return ""
  let p = " " + raw + " "

  // Remove common section labels that models may try to render as visible text
  const labels = [
    "Style",
    "World",
    "World Type",
    "Lighting",
    "Effects",
    "Props",
    "Species focus",
    "Add",
    "Optional effects",
  ]
  for (const lbl of labels) {
    const re = new RegExp(`\\b${lbl}\\s*:\\s*`, "gi")
    p = p.replace(re, "")
  }

  // Remove instructional meta phrases that can show up literally
  p = p
    .replace(/Safe[- ]?for[- ]?work[^.]*\.?/gi, "")
    .replace(/family[- ]?friendly[^.]*\.?/gi, "")
    .replace(/non[- ]?violent[^.]*\.?/gi, "")
    .replace(/\bInclude motion[- ]line(s)?[^.]*\.?/gi, "")
    .replace(/\bMotion lines allowed\.?/gi, "")
    .replace(/\bTarget blend\s*\d+%\s*toon vs real\.?/gi, "")

  // Collapse multiple spaces and stray punctuation spacing
  p = p
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim()

  // Add a short anti-text instruction (kept concise to avoid overconstraining)
  if (!/no text|no captions/i.test(p)) {
    p += ". No text, captions, labels, logos, or watermarks."
  }

  return p
}
