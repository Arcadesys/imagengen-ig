import type { Trait } from "@/lib/types"

// Minimal in-memory dataset for traits. In a real app this would come from a DB.
export const TRAITS: Trait[] = [
  // Colors
  { id: "color-1", name: "Pastel", category: "Color", aliases: ["soft colors", "muted"] },
  { id: "color-2", name: "Monochrome", category: "Color", aliases: ["black and white", "grayscale"] },
  { id: "color-3", name: "Vibrant", category: "Color", aliases: ["saturated", "bold colors"] },
  { id: "color-4", name: "Complementary", category: "Color" },

  // Styles
  { id: "style-1", name: "Watercolor", category: "Style" },
  { id: "style-2", name: "Impressionist", category: "Style" },
  { id: "style-3", name: "Minimalist", category: "Style" },
  { id: "style-4", name: "Photorealistic", category: "Style", aliases: ["realistic"] },

  // Lighting
  { id: "lighting-1", name: "Golden Hour", category: "Lighting", aliases: ["sunset glow"] },
  { id: "lighting-2", name: "Soft Studio", category: "Lighting" },
  { id: "lighting-3", name: "Backlit", category: "Lighting" },

  // Mood
  { id: "mood-1", name: "Cozy", category: "Mood", aliases: ["warm", "comforting"] },
  { id: "mood-2", name: "Serene", category: "Mood", aliases: ["calm", "peaceful"] },
  { id: "mood-3", name: "Adventurous", category: "Mood" },

  // Composition
  { id: "comp-1", name: "Rule of Thirds", category: "Composition" },
  { id: "comp-2", name: "Centered Subject", category: "Composition" },
  { id: "comp-3", name: "Wide Shot", category: "Composition" },

  // Camera
  { id: "cam-1", name: "35mm", category: "Camera" },
  { id: "cam-2", name: "Macro", category: "Camera" },
  { id: "cam-3", name: "Shallow Depth of Field", category: "Camera" },

  // Details
  { id: "det-1", name: "Intricate Textures", category: "Details" },
  { id: "det-2", name: "Fine Linework", category: "Details" },
]

export function searchTraits({ q, categories, limit = 20 }: { q?: string; categories?: string[]; limit?: number }) {
  const term = (q ?? "").trim().toLowerCase()
  const cats = categories?.map((c) => c.toLowerCase())
  let items = TRAITS
  if (cats && cats.length) {
    items = items.filter((t) => cats.includes(t.category.toLowerCase()))
  }
  if (term) {
    items = items.filter((t) =>
      [t.name, ...(t.aliases ?? [])].some((s) => s.toLowerCase().includes(term)),
    )
  }
  return items.slice(0, limit)
}
