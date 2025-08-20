import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "../app/api/images/generate/route"
import { POST as STREAM_POST } from "../app/api/images/generate/stream/route"

// Mock all dependencies to avoid Prisma issues
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
  saveImage: vi.fn(() => ({ id: "test-id", url: "/test-url", prompt: "test" })),
}))

vi.mock("../lib/db", () => ({
  prisma: {
    image: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("../lib/image-generation-utils", async () => {
  const actual = await vi.importActual<typeof import("../lib/image-generation-utils")>(
    "../lib/image-generation-utils",
  )
  return {
    ...actual,
    dataURLToBuffer: vi.fn(() => Buffer.from("test")),
    getBaseImagePath: vi.fn(() => null),
    ensureDirectories: vi.fn(),
    // keep validateGenerateRequest from actual module
  }
})

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
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      images: {
        generate: mockGenerate,
      },
    })),
  }
})

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

describe("API Integration Test", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = "test-key"
    
    mockGenerate.mockResolvedValue({
      data: [
        {
          url: "http://test.com/image.png",
        },
      ],
    })
    
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "image/png" : null) },
      arrayBuffer: async () => new ArrayBuffer(8),
    })
  })

  it("should generate images via regular endpoint", async () => {
    const request = {
      json: async () => ({
        prompt: "test prompt",
        size: "512x512",
        n: 1,
      }),
    } as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.images).toHaveLength(1)
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-image-1",
        prompt: "test prompt",
        size: "512x512",
        n: 1,
      })
    )
  })

  it("should handle validation errors", async () => {
    const request = {
      json: async () => ({
        prompt: "",
        size: "512x512", 
        n: 1,
      }),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toContain("Prompt is required")
  })

  it("should handle missing API key", async () => {
    delete process.env.OPENAI_API_KEY
    
    const request = {
      json: async () => ({
        prompt: "test prompt",
        size: "512x512",
        n: 1,
      }),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toContain("API key is not configured")
  })
})