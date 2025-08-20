import { describe, it, expect, vi, beforeEach } from "vitest"
import { ImageGenerationService } from "../lib/image-generation-service"
import type { GenerateRequest } from "../lib/image-generation-types"

// Mock external dependencies
vi.mock("../lib/prompt-sanitizer", () => ({
  sanitizePromptForImage: vi.fn((prompt) => prompt),
}))

vi.mock("../lib/prompt-moderator", () => ({
  checkPromptSafety: vi.fn(() => ({ allowed: true, cleaned: null })),
}))

vi.mock("../lib/admin", () => ({
  isAdminRequest: vi.fn(() => true),
}))

vi.mock("../lib/images", () => ({
  saveImage: vi.fn(() => ({ id: "test-id", url: "/test-url" })),
}))

vi.mock("../lib/db", () => ({
  prisma: {
    image: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("fs/promises", () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}))

vi.mock("fs", () => ({
  existsSync: vi.fn(() => true),
  createReadStream: vi.fn(),
}))

// Mock OpenAI
const mockGenerate = vi.fn()
const mockEdit = vi.fn()

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      images: {
        generate: mockGenerate,
        edit: mockEdit,
      },
    })),
  }
})

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

describe("ImageGenerationService", () => {
  let service: ImageGenerationService
  
  beforeEach(() => {
    vi.clearAllMocks()
    service = new ImageGenerationService()
    
    // Set up environment
    process.env.OPENAI_API_KEY = "test-key"
    
    // Mock successful OpenAI response
    mockGenerate.mockResolvedValue({
      data: [
        {
          url: "http://test.com/image.png",
        },
      ],
    })
    
    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "image/png" : null) },
      arrayBuffer: async () => new ArrayBuffer(8),
    })
  })

  it("should generate images successfully", async () => {
    const request: GenerateRequest = {
      prompt: "test prompt",
      size: "512x512",
      n: 1,
    }

    const result = await service.generateImages(request)

    expect(result.images).toHaveLength(1)
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-image-1",
        prompt: "test prompt",
        size: "512x512",
        n: 1,
      })
    )
  })

  it("should call progress callback when enabled", async () => {
    const request: GenerateRequest = {
      prompt: "test prompt",
      size: "512x512",
      n: 1,
    }

    const onProgress = vi.fn()
    
    await service.generateImages(request, undefined, {
      enableProgress: true,
      onProgress,
    })

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "progress",
        status: "idle",
        progress: 0,
        message: "Initializing generation...",
      })
    )
    
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "complete",
        status: "complete",
        progress: 100,
      })
    )
  })

  it("should handle validation errors", async () => {
    const request: GenerateRequest = {
      prompt: "",
      size: "512x512",
      n: 1,
    }

    await expect(service.generateImages(request)).rejects.toThrow("Prompt is required")
  })

  it("should handle API key missing", async () => {
    delete process.env.OPENAI_API_KEY

    const request: GenerateRequest = {
      prompt: "test prompt",
      size: "512x512",
      n: 1,
    }

    await expect(service.generateImages(request)).rejects.toThrow("OpenAI API key is not configured")
  })
})