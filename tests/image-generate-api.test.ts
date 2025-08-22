import { describe, it, expect, vi, beforeEach } from "vitest"
// Hoist the mock function so it's available when vi.mock is hoisted
const { mockGenerate } = vi.hoisted(() => {
  return {
    mockGenerate: vi.fn().mockResolvedValue({ data: [{ url: "http://test.com/image.png" }] }),
  }
})
vi.mock("openai", () => ({ default: vi.fn(() => ({ images: { generate: mockGenerate } })) }))
import { POST } from "../app/api/images/generate/route"

const mockEnv = (key: string, value: string) => {
  process.env[key] = value
}

describe("Image Generation API", () => {
  beforeEach(() => {
    mockEnv("OPENAI_API_KEY", "test-key")
  })

  it("returns 400 if prompt is missing", async () => {
    const req = { 
      json: async () => ({ size: "512x512", n: 1 }),
      headers: { get: vi.fn().mockReturnValue(null) }
    } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Prompt is required/)
  })

  it("returns 400 if size is invalid", async () => {
    const req = { 
      json: async () => ({ prompt: "cat", size: "invalid", n: 1 }),
      headers: { get: vi.fn().mockReturnValue(null) }
    } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Invalid size/)
  })

  it("returns 400 if n is invalid", async () => {
    const req = { 
      json: async () => ({ prompt: "cat", size: "512x512", n: 0 }),
      headers: { get: vi.fn().mockReturnValue(null) }
    } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Number of images/)
  })

  it("returns 500 if OPENAI_API_KEY is missing", async () => {
    process.env.OPENAI_API_KEY = ""
    const req = { 
      json: async () => ({ prompt: "cat", size: "512x512", n: 1 }),
      headers: { get: vi.fn().mockReturnValue(null) }
    } as any
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/API key is not configured/)
  })

  it("calls OpenAI API with correct params", async () => {
    // Mock the image download fetch to succeed
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "image/png" : null) },
      arrayBuffer: async () => new ArrayBuffer(8),
    })
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)

  const req = { 
    json: async () => ({ prompt: "cat", size: "512x512", n: 1 }),
    headers: { get: vi.fn().mockReturnValue(null) }
  } as any
  const res = await POST(req)
  expect(mockGenerate).toHaveBeenCalled()
  const call = mockGenerate.mock.calls[0][0]
  expect(call).toEqual(expect.objectContaining({ size: "512x512", n: 1 }))
  expect(call.prompt).toEqual(expect.stringContaining("cat"))
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.images[0].url).toMatch(/^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/images\//)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^http:\/\/test\.com\/image\.png/))
    vi.unstubAllGlobals()
  })
})
