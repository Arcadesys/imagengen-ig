export interface GenerateRequest {
  prompt: string
  expandedPrompt?: string | null
  // Optional for Auto sizing; when omitted, service will choose a default
  size?: "1024x1024" | "1024x1536" | "1536x1024"
  n: number
  seed?: string | number | null
  baseImageId?: string | null
  maskData?: string | null
  sessionId?: string | null // For grouping images into sessions
}

export interface GeneratedImage {
  id: string
  url: string
  metadata: {
    prompt: string
    expandedPrompt?: string
  // Optional display size; not persisted to DB in Auto mode
  size?: string
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