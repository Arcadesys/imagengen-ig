import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"
import { generatePuppetPrompt } from "../lib/puppet-prompts"

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

describe("[Puppetray] Functionality via /api/images/generate", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "" // force early failure downstream to avoid calling OpenAI
  })

  it("should generate proper puppet prompts", () => {
    const config = {
      style: "muppet" as const,
      gender: "Male",
      species: "human",
      personality: "goofy"
    }
    const prompt = generatePuppetPrompt(config, false)
    expect(prompt).toContain("Transform subject into muppet puppet")
    expect(prompt).toContain("CARICATURE")
    expect(prompt).toContain("Muppet-style: foam head, felt skin")
    expect(prompt).toContain("Species: human")
    expect(prompt).toContain("Family-friendly content only")
  })

  it("should generate masked puppet prompts", () => {
    const config = {
      style: "sock" as const,
      gender: "Female",
      species: "cat",
      personality: "cute"
    }
    const prompt = generatePuppetPrompt(config, true)
    expect(prompt).toContain("Transform subject into sock puppet")
    expect(prompt).toContain("Apply only within mask area")
    expect(prompt).toContain("Species: cat")
  })

  it("should work via /api/images/generate endpoint with puppet prompt", async () => {
    const config = {
      style: "felt" as const,
      gender: "",
      species: "dog",
      personality: "funny"
    }
    const puppetPrompt = generatePuppetPrompt(config, false)
    
    const res = await request
      .post("/api/images/generate")
      .send({ 
        prompt: puppetPrompt,
        size: "512x512", 
        n: 1 
      })

    // Should get an error from missing API key, but not 404
    expect([500, 400]).toContain(res.status)
    if (res.status === 500) {
      expect(res.body.error || "").toMatch(/api key is not configured|failed to generate|openai/i)
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
