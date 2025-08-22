import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"

// Ensure Webpack dev server is used instead of Turbopack for stability in tests
process.env.NEXT_DISABLE_TURBOPACK = process.env.NEXT_DISABLE_TURBOPACK || "1"

const app = next({ dev: true, dir: process.cwd() })
let server: any
let request: any

beforeAll(async () => {
  await app.prepare()
  server = createServer((req, res) => app.getRequestHandler()(req, res))
  await new Promise((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  request = supertest(`http://localhost:${port}`)
}, 60000)

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err: any) => (err ? reject(err) : resolve()))
    })
  }
})

describe("[API] /api/images/generate", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key"
  })

  it("should return 400 if prompt is missing", async () => {
    const res = await request.post("/api/images/generate").send({ size: "512x512", n: 1 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Prompt is required/)
  }, 15000)

  it("should return 400 if size is invalid", async () => {
    const res = await request.post("/api/images/generate").send({ prompt: "cat", size: "invalid", n: 1 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Invalid size/)
  }, 15000)

  it("should return 400 if n is invalid", async () => {
    const res = await request.post("/api/images/generate").send({ prompt: "cat", size: "512x512", n: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Number of images/)
  }, 15000)

  it("should return 500 if OPENAI_API_KEY is missing", async () => {
    process.env.OPENAI_API_KEY = ""
    const res = await request.post("/api/images/generate").send({ prompt: "cat", size: "512x512", n: 1 })
    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/API key is not configured/)
  }, 15000)

  // You can add more tests for successful generation by mocking OpenAI if needed
})
