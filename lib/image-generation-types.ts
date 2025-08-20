export interface GenerateRequest {
  prompt: string
  expandedPrompt?: string | null
  size: "512x512" | "768x768" | "1024x1024"
  n: number
  seed?: string | number | null
  baseImageId?: string | null
  maskData?: string | null
}

export interface GeneratedImage {
  id: string
  url: string
  metadata: {
    prompt: string
    expandedPrompt?: string
    size: string
    seed?: string | number
    baseImageId?: string | null
    hasMask?: boolean
    provider: string
  }
}

export interface ProgressEvent {
  type: "progress" | "complete" | "error"
  status: "idle" | "uploading" | "processing" | "generating" | "downloading" | "complete" | "error"
  progress: number
  message: string
  generatedCount?: number
  totalCount?: number
  images?: GeneratedImage[]
  error?: string
}

export type GenerationStatus = ProgressEvent["status"]

export interface ImageGenerationResult {
  images: GeneratedImage[]
}

export interface ImageGenerationOptions {
  enableProgress?: boolean
  onProgress?: (event: ProgressEvent) => void
}