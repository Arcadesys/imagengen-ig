import path from "path"
import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { renderTemplate } from "./template"
import { PROMPT_PRESETS, DEFAULT_TOON_PRESET_ID } from "./prompt-presets"

export interface GenerationProfile {
  id: string
  name: string
  description?: string
  // A template string, compatible with renderTemplate([[var|filters]])
  template: string
  // Optional defaults for variables
  defaults?: Record<string, unknown>
}

// Built-in default profiles. These can be extended/overridden via data/profiles.json.
const builtinProfiles: GenerationProfile[] = [
  {
    id: "puppetray",
    name: "Puppet Transform",
    description:
      "Turn the (masked) subject into a puppet while preserving the real scene.",
    template:
      [
        "Convert the subject into a puppet version while preserving pose, camera, composition, and background.",
        "CRITICAL: PRESERVE COMPLETE OUTFIT. Maintain ALL clothing items exactly: shirts, pants, dresses, jackets, shoes, hats, accessories, jewelry, watches, belts, ties, scarves, bags, etc.",
        "Keep clothing colors, patterns, textures, logos, text, designs, cuts, and fit identical but translated into puppet-appropriate fabric materials.",
        "Convert clothing materials to felt, fabric, or appropriate puppet materials while maintaining every visual detail of the original outfit.",
        "Maintain subject identity features (face structure, hair style, glasses, facial hair) translated into puppet materials.",
        "Puppet style: [[puppetStyle|title]].",
        "Do not change the real environment (background/scene remains real).",
        "Use scene-matched lighting and cast plausible contact shadows from the puppet onto nearby surfaces.",
        "Keep a clean digital look; avoid glossy CGI.",
        "Materials: fabric, felt, foam, thread, embroidery. Avoid human skin texture; replace with fabric surface and stitched seams.",
        "[[prompt|prefix:Subject detail: ,true]].",
        "[[mask_data|if:Apply only within the provided mask; do not alter outside the mask.]]",
        "Safe-for-work, family-friendly, non-violent.",
      ].join(" "),
    defaults: {
      puppetStyle: "felt",
    },
  },
  {
    id: "turn-toon",
    name: "Turn-Toon (Cartoons in Live Action)",
    description:
      "2D/2.5D cartoon characters composited into live-action without changing the real environment.",
    template: (PROMPT_PRESETS.find((p) => p.id === DEFAULT_TOON_PRESET_ID) || PROMPT_PRESETS[0]).template,
    defaults: {
      body_style: "Saturday-morning cel",
      world_type: "realistic live action",
      lighting: "scene-matched HDR",
      blend_ratio: 80,
      effects: [],
      props_list: [],
      motion_lines: false,
      custom_note: "",
    },
  },
]

export async function loadProfiles(): Promise<GenerationProfile[]> {
  const dataPath = path.join(process.cwd(), "data", "profiles.json")
  let dynamic: GenerationProfile[] = []
  if (existsSync(dataPath)) {
    try {
      const s = await readFile(dataPath, "utf-8")
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) dynamic = parsed
    } catch (e) {
      console.warn("[profiles] Failed to load data/profiles.json:", e)
    }
  }
  // Merge by id, allowing dynamic to override builtin
  const byId: Record<string, GenerationProfile> = {}
  for (const p of builtinProfiles) byId[p.id] = p
  for (const p of dynamic) byId[p.id] = p
  return Object.values(byId)
}

export async function getProfile(id: string): Promise<GenerationProfile | undefined> {
  const all = await loadProfiles()
  return all.find((p) => p.id === id)
}

export function renderProfileTemplate(profile: GenerationProfile, vars: Record<string, unknown>) {
  const merged = { ...(profile.defaults || {}), ...vars }
  return renderTemplate(profile.template, merged)
}
