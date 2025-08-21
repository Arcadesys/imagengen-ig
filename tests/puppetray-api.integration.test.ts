import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"

const app = next({ dev: true, dir: process.cwd() })
let server: any
let request: any
let originalOpenAiKey: string | undefined

beforeAll(async () => {
  originalOpenAiKey = process.env.OPENAI_API_KEY
  await app.prepare()
  server = createServer((req, res) => app.getRequestHandler()(req, res))
  await new Promise((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  request = supertest(`http://localhost:${port}`)
})

describe("[API] /api/puppetray", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "" // force early failure downstream to avoid calling OpenAI
  })

  it("returns 400 when puppetStyle is missing", async () => {
    const res = await request.post("/api/puppetray").send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/puppetStyle is required/i)
  }, 15000)

  it("wires through to generator and fails fast without API key", async () => {
    const res = await request
      .post("/api/puppetray")
      .send({ puppetStyle: "muppet", size: "512x512", n: 1 })

    expect([500, 400]).toContain(res.status)
    // Most likely 500 from missing API key propagated from /api/images/generate
    if (res.status === 500) {
      expect(res.body.error || "").toMatch(/api key is not configured|failed to generate images/i)
    }
  }, 15000)
})

afterAll(async () => {
  // Restore mutated environment and ensure server is closed to avoid open handles
  process.env.OPENAI_API_KEY = originalOpenAiKey
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
