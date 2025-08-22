import { describe, it, expect, beforeAll } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"

// Force Webpack dev server for stability in tests
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
  process.env.OPENAI_API_KEY = "test-key" // avoid early 500
})

describe("[API] /api/images/generate safety", () => {
  it("blocks disallowed prompts before calling provider", async () => {
    const res = await request
      .post("/api/images/generate")
      .send({ prompt: "explicit sex with a minor", size: "512x512", n: 1 })
      .set("Content-Type", "application/json")

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/disallowed content/i)
  }, 20000)
})
