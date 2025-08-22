import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"
import fs from "fs"
import path from "path"

// Force Webpack dev server for tests
process.env.NEXT_DISABLE_TURBOPACK = process.env.NEXT_DISABLE_TURBOPACK || "1"

const app = next({ dev: true, dir: process.cwd() })
let server: any
let request: supertest.SuperTest<supertest.Test>

async function readJson<T = any>(p: string): Promise<T | null> {
  try {
    const s = await fs.promises.readFile(p, "utf8")
    return JSON.parse(s)
  } catch {
    return null
  }
}

beforeAll(async () => {
  await app.prepare()
  server = createServer((req, res) => app.getRequestHandler()(req, res))
  await new Promise((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  request = supertest(`http://localhost:${port}`)
}, 30000)

afterAll(async () => {
  if (server) await new Promise((r) => server.close(r))
})

describe("[API] /api/gallery", () => {
  const galleryPath = path.join(process.cwd(), "data", "gallery.json")
  let snapshot: any = null

  beforeEach(async () => {
    snapshot = await readJson(galleryPath)
  })

  it(
    "returns [] when empty",
    async () => {
      // Temporarily move gallery file out of the way if it exists
      const temp = galleryPath + ".bak"
      try {
        await fs.promises.rename(galleryPath, temp)
      } catch {}

      const res = await request.get("/api/gallery")
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)

      // restore
      try {
        await fs.promises.rename(temp, galleryPath)
      } catch {}
    },
    15000,
  )

  it(
    "rejects missing fields on POST",
    async () => {
      const res = await request.post("/api/gallery").send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Missing required fields/i)
    },
    15000,
  )

  it(
    "adds an image and then returns it from GET (newest first)",
    async () => {
      const payload = {
        id: "test-image-1",
        url: "/generated/test-image-1.png",
        prompt: "a test image",
        size: "512x512" as const,
        seed: 123,
        baseImageId: null,
      }

      const resPost = await request.post("/api/gallery").send(payload)
      expect(resPost.status).toBe(200)
      expect(resPost.body.id).toBe(payload.id)
      expect(resPost.body.url).toBe(payload.url)
      expect(resPost.body.createdAt).toBeTruthy()

      const resGet = await request.get("/api/gallery")
      expect(resGet.status).toBe(200)
      const list = resGet.body as any[]
      expect(Array.isArray(list)).toBe(true)
      expect(list[0].id).toBe(payload.id)

      // cleanup: remove our test record
      try {
        const json = (await readJson<any[]>(galleryPath)) || []
        const filtered = json.filter((x) => x.id !== payload.id)
        await fs.promises.writeFile(galleryPath, JSON.stringify(filtered, null, 2), "utf8")
      } catch {}
    },
    20000,
  )

  it(
    "accepts batch payload { images: [...] } and returns them via GET",
    async () => {
      const genId = "generated-batch-1"
      const payload = {
        images: [
          {
            id: genId,
            url: "/generated/generated-batch-1.png",
            metadata: {
              prompt: "toon cat",
              size: "512x512" as const,
              seed: 42,
              baseImageId: null,
            },
          },
        ],
      }

      const resPost = await request.post("/api/gallery").send(payload)
      expect(resPost.status).toBe(200)
      const saved = resPost.body as any[]
      expect(Array.isArray(saved)).toBe(true)
      expect(saved[0].id).toBe(genId)
      expect(saved[0].prompt).toBe("toon cat")

      const resGet = await request.get("/api/gallery")
      expect(resGet.status).toBe(200)
      const list = resGet.body as any[]
      const rec = list.find((x) => x.id === genId)
      expect(rec).toBeTruthy()

      // cleanup
      try {
        const json = (await readJson<any[]>(galleryPath)) || []
        const filtered = json.filter((x) => x.id !== genId)
        await fs.promises.writeFile(galleryPath, JSON.stringify(filtered, null, 2), "utf8")
      } catch {}
    },
    20000,
  )
})
