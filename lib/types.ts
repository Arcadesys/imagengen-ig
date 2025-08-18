export interface GeneratedImage {
  id: string
  url: string
  metadata: {
    prompt: string
    expandedPrompt?: string
    size: "512x512" | "768x768" | "1024x1024"
    seed?: string | number
    baseImageId?: string | null
    provider: string
  }
}

export interface GalleryImage {
  id: string
  url: string
  prompt: string
  expandedPrompt?: string
  size: "512x512" | "768x768" | "1024x1024"
  seed?: string | number
  baseImageId?: string | null
  createdAt: string
}

export interface UploadedImage {
  id: string
  url: string
  filename: string
  createdAt: string
}

export interface GenerateRequest {
  prompt: string
  expandedPrompt?: string | null
  size: "512x512" | "768x768" | "1024x1024"
  n: number
  seed?: string | number | null
  baseImageId?: string | null
}

export type TraitCategory =
  | "Color"
  | "Style"
  | "Lighting"
  | "Mood"
  | "Composition"
  | "Camera"
  | "Details"

export interface Trait {
  id: string
  name: string
  category: TraitCategory
  aliases?: string[]
}
