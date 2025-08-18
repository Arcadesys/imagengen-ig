export interface GeneratedImage {
  id: string
  url: string
  metadata: {
    prompt: string
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
  size: "512x512" | "768x768" | "1024x1024"
  n: number
  seed?: string | number | null
  baseImageId?: string | null
}
