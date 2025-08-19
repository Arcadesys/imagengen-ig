/**
 * Simple, local prompt safety filter for image generation.
 *
 * - Blocks clearly disallowed content (sexual minors, explicit sexual content, extreme violence, self-harm instructions, criminal instructions, hateful slurs).
 * - Soft-cleans milder triggers (nudity, gore/blood, weapon emphasis) by removing or softening words.
 *
 * This does not replace provider safety systems, but reduces obvious rejections before API calls.
 */
export type SafetyResult = {
  allowed: boolean
  severity: "safe" | "warn" | "block"
  cleaned?: string
  reason?: string
}

// Build regexes carefully; avoid listing explicit slurs in code comments/logs.
const blocklist: Array<{ re: RegExp; reason: string }> = [
  // Sexual content involving minors or incest
  { re: /(minor|under\s*age|child|teen)\s*(sexual|nude|explicit|sex)/i, reason: "sexual content involving minors" },
  { re: /(incest|bestiality)/i, reason: "sexual content that is exploitative or non-consensual" },
  // Explicit sexual acts
  { re: /(porn|hardcore|explicit sex|graphic sex|sexual penetration)/i, reason: "explicit sexual content" },
  // Self-harm or suicide instructions
  { re: /(how to|instructions? to).*(kill myself|suicide|self[-\s]?harm)/i, reason: "self-harm instructions" },
  // Violence instructions or praise for harm
  { re: /(how to|instructions? to).*(kill|murder|assault|stab|shoot)/i, reason: "violent wrongdoing instructions" },
  // Weapons with intent
  { re: /(make|build).*(bomb|explosive|improvised explosive|molotov)/i, reason: "explosive/weapon construction" },
  // Hateful slurs (very rough catch; rely on provider too)
  { re: /(\b(?:kike|fag|nigg|chink|spic|trann|retard)\w*\b)/i, reason: "hateful or harassing content" },
]

const warnlist: Array<{ re: RegExp; replace?: string }> = [
  // Mild nudity/sexual terms
  { re: /\b(nude|nudity|topless|bottomless)\b/gi, replace: "" },
  { re: /\b(erotic|sensual)\b/gi, replace: "" },
  // Graphic violence/gore
  { re: /\b(blood|bloody|gore|gory|dismember(ed|ment)?|decapitat(ed|ion)?)\b/gi, replace: "" },
  // Weapons emphasis
  { re: /\b(gun|rifle|pistol|shotgun|assault rifle|ak-?47|ar-?15|weapon)\b/gi, replace: "" },
]

export function checkPromptSafety(raw: string): SafetyResult {
  const text = (raw || "").trim()
  if (!text) return { allowed: true, severity: "safe" }

  // Block check
  for (const item of blocklist) {
    if (item.re.test(text)) {
      return { allowed: false, severity: "block", reason: `Prompt blocked due to ${item.reason}.` }
    }
  }

  // Soft-clean mild triggers and specific banned phrasing
  let cleaned = text
  // Always remove the problematic term explicitly mentioned by the user
  cleaned = cleaned.replace(/\brubber\s*-?\s*hose\b/gi, "vintage rubber-limb animation")
  let changed = false
  for (const w of warnlist) {
    if (w.re.test(cleaned)) {
      cleaned = cleaned.replace(w.re, w.replace ?? "")
      changed = true
    }
  }

  // Collapse artifacts from removals
  if (changed) {
    cleaned = cleaned
      .replace(/\s+([,.!?:;])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .trim()
  }

  return { allowed: true, severity: changed ? "warn" : "safe", cleaned }
}
