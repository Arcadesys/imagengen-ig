/**
 * Enhanced prompt safety filter for DALL-E 3 image generation.
 *
 * - Blocks clearly disallowed content (sexual minors, explicit sexual content, extreme violence, self-harm instructions, criminal instructions, hateful slurs).
 * - Soft-cleans milder triggers (nudity, gore/blood, weapon emphasis) by removing or softening words.
 * - Enhanced for DALL-E 3 safety compliance after user feedback
 *
 * This does not replace provider safety systems, but reduces obvious rejections before API calls.
 */
export type SafetyResult = {
  allowed: boolean
  severity: "safe" | "warn" | "block"
  cleaned?: string
  reason?: string
}

// Enhanced blocklist for DALL-E 3 compliance
const blocklist: Array<{ re: RegExp; reason: string }> = [
  // Sexual content involving minors or incest
  { re: /(minor|under\s*age|child|teen|kid|adolescent|juvenile)\s*(sexual|nude|explicit|sex|naked|undressed)/i, reason: "sexual content involving minors" },
  { re: /(incest|bestiality|zoophilia)/i, reason: "sexual content that is exploitative or non-consensual" },
  
  // Explicit sexual acts - enhanced patterns
  { re: /(porn|hardcore|explicit sex|graphic sex|sexual penetration|orgasm|masturbat|fellatio|cunnilingus)/i, reason: "explicit sexual content" },
  { re: /(sexual intercourse|sexual activity|sexual acts|genitals|penis|vagina|breast|nipple)/i, reason: "explicit sexual content" },
  
  // Self-harm or suicide instructions
  { re: /(how to|instructions? to|guide to).*(kill myself|suicide|self[-\s]?harm|cut myself|overdose)/i, reason: "self-harm instructions" },
  
  // Violence instructions or praise for harm
  { re: /(how to|instructions? to|guide to).*(kill|murder|assault|stab|shoot|torture|harm)/i, reason: "violent wrongdoing instructions" },
  { re: /(torture|mutilat|dismember|decapitat|execution|genocide)/i, reason: "extreme violence" },
  
  // Weapons with intent - enhanced
  { re: /(make|build|create|construct).*(bomb|explosive|improvised explosive|molotov|grenade|weapon)/i, reason: "explosive/weapon construction" },
  
  // Hateful slurs and discriminatory content - enhanced
  { re: /(\b(?:kike|fag|nigg|chink|spic|trann|retard)\w*\b)/i, reason: "hateful or harassing content" },
  { re: /(nazi|hitler|holocaust denial|white supremacy|kkk)/i, reason: "hateful ideology" },
  
  // Drug manufacturing/illegal activity
  { re: /(how to make|manufacturing|producing).*(meth|cocaine|heroin|lsd|illegal drugs)/i, reason: "illegal drug manufacturing" },
  
  // Celebrity deepfakes or impersonation
  { re: /(deepfake|face swap|impersonat).*(celebrity|famous person|public figure)/i, reason: "unauthorized impersonation" },
  
  // Political figures in sensitive contexts (enhanced for current events)
  { re: /(political assassination|killing politicians|terrorist attack)/i, reason: "political violence" },
]

// Enhanced warnlist for milder content that should be softened
const warnlist: Array<{ re: RegExp; replace?: string }> = [
  // Mild nudity/sexual terms - enhanced
  { re: /\b(nude|nudity|topless|bottomless|naked|undressed|scantily clad)\b/gi, replace: "clothed" },
  { re: /\b(erotic|sensual|seductive|provocative)\b/gi, replace: "artistic" },
  { re: /\b(lingerie|underwear|bra|panties)\b/gi, replace: "clothing" },
  
  // Graphic violence/gore - enhanced
  { re: /\b(blood|bloody|gore|gory|dismember(ed|ment)?|decapitat(ed|ion)?|mutilat(ed|ion)?)\b/gi, replace: "" },
  { re: /\b(corpse|dead body|cadaver|violence|brutal|savage)\b/gi, replace: "" },
  
  // Weapons emphasis - enhanced
  { re: /\b(gun|rifle|pistol|shotgun|assault rifle|ak-?47|ar-?15|weapon|firearm)\b/gi, replace: "" },
  { re: /\b(knife|sword|blade|dagger|machete|axe)\b/gi, replace: "tool" },
  { re: /\b(shooting|stabbing|cutting|slashing)\b/gi, replace: "" },
  
  // Substance abuse
  { re: /\b(smoking|drinking alcohol|drunk|intoxicated|high on drugs)\b/gi, replace: "" },
  
  // Controversial symbols
  { re: /\b(swastika|confederate flag|hate symbol)\b/gi, replace: "" },
  
  // Medical/anatomical that might be flagged
  { re: /\b(surgery|medical procedure|operation|dissection)\b/gi, replace: "medical scene" },
]

export function checkPromptSafety(raw: string): SafetyResult {
  const text = (raw || "").trim()
  if (!text) return { allowed: true, severity: "safe" }

  // Block check - enhanced logging
  for (const item of blocklist) {
    if (item.re.test(text)) {
      console.warn(`[SAFETY] Blocked prompt due to: ${item.reason}`)
      return { allowed: false, severity: "block", reason: `Content blocked: ${item.reason}` }
    }
  }

  // Soft-clean mild triggers and specific banned phrasing
  let cleaned = text
  
  // Always remove the problematic term explicitly mentioned by the user
  cleaned = cleaned.replace(/\brubber\s*-?\s*hose\b/gi, "vintage rubber-limb animation")
  
  // Enhanced cleaning for DALL-E 3 compliance
  let changed = false
  for (const w of warnlist) {
    if (w.re.test(cleaned)) {
      const before = cleaned
      cleaned = cleaned.replace(w.re, w.replace ?? "")
      if (cleaned !== before) {
        changed = true
        console.log(`[SAFETY] Cleaned content: replaced flagged terms`)
      }
    }
  }

  // Additional safety measures for DALL-E 3
  // Remove any remaining potentially problematic patterns
  const additionalCleanup = [
    { re: /\b(realistic|photorealistic|hyperrealistic)\s+(child|minor|teen|kid)\b/gi, replace: "cartoon character" },
    { re: /\b(famous|celebrity|well-known)\s+(person|individual|figure)\b/gi, replace: "fictional character" },
    { re: /\bmade by\s+[\w\s]+/gi, replace: "" }, // Remove attribution attempts
  ]

  for (const cleanup of additionalCleanup) {
    if (cleanup.re.test(cleaned)) {
      cleaned = cleaned.replace(cleanup.re, cleanup.replace)
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

  // Final check - if cleaned prompt is too short or empty, provide fallback
  if (changed && cleaned.trim().length < 10) {
    cleaned = "A safe, family-friendly artistic scene"
  }

  return { 
    allowed: true, 
    severity: changed ? "warn" : "safe", 
    cleaned: changed ? cleaned : undefined 
  }
}
