import { describe, it, expect, beforeAll, afterAll } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"
import path from "path"
import fs from "fs"

// Force Webpack dev server for tests
process.env.NEXT_DISABLE_TURBOPACK = process.env.NEXT_DISABLE_TURBOPACK || "1"

const app = next({ dev: true, dir: process.cwd() })
let server: any
let request: supertest.SuperTest<supertest.Test>

async function fileExists(p: string) {
  try {
    await fs.promises.access(p, fs.constants.F_OK)
    return true
  } catch {
    return false
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
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

describe("[API] /api/images/upload", () => {
  it(
    "returns 400 when no file provided",
    async () => {
      // Must send multipart/form-data, otherwise Next formData() throws and returns 500
      const res = await request
        .post("/api/images/upload")
        .field("empty", "true") // creates a multipart request with no file
        .set("Accept", "application/json")
      expect(res.status).toBe(400)
      expect(res.body?.error || "").toMatch(/No file provided/i)
    },
    15000,
  )

  it(
    "returns 400 for invalid file type",
    async () => {
      const res = await request
        .post("/api/images/upload")
        .attach("file", Buffer.from("hello"), {
          filename: "test.txt",
          contentType: "text/plain",
        })
      expect(res.status).toBe(400)
      expect(res.body?.error || "").toMatch(/Invalid file type/i)
    },
    20000,
  )

  it(
    "returns 400 for file too large (>10MB) with invalid image data",
    async () => {
      const bigSize = 10 * 1024 * 1024 + 1
      const res = await request
        .post("/api/images/upload")
        .attach("file", Buffer.alloc(bigSize, 0), {
          filename: "big.png",
          contentType: "image/png",
        })
      expect(res.status).toBe(400)
      // Now that the API attempts compression, invalid image data will fail processing
      expect(res.body?.error || "").toMatch(/Failed to process image/i)
    },
    60000,
  )

  it(
    "auto-resizes an oversized image under the size limit",
    async () => {
      // Use a small max size to force compression path
      const prevLimit = process.env.UPLOAD_MAX_SIZE_BYTES
      process.env.UPLOAD_MAX_SIZE_BYTES = `${200_000}` // 200KB

      // Dynamically import sharp to generate a valid large PNG buffer with noise
      const sharp = await import("sharp")
      const width = 2500
      const height = 2000
      const rgb = Buffer.alloc(width * height * 3)
      for (let i = 0; i < rgb.length; i++) rgb[i] = (i * 31) % 256
      const largeBuffer = await sharp.default(Buffer.from(rgb), {
        raw: { width, height, channels: 3 },
      })
        .png({ compressionLevel: 0, adaptiveFiltering: false })
        .toBuffer()

      const res = await request
        .post("/api/images/upload")
        .attach("file", largeBuffer, { filename: "large.png", contentType: "image/png" })

      expect(res.status).toBe(200)
      const { url, baseImageId } = res.body as { url: string; baseImageId: string }
      // Updated: Now expects Supabase URL format
      expect(url).toMatch(/^https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/images\/uploads\//)
      expect(baseImageId).toBeTruthy()

      // Test that the image is accessible via redirect
      const imgRes = await request.get(`/api/images/${baseImageId}`)
      expect(imgRes.status).toBe(302) // Redirect to Supabase URL
      expect(imgRes.headers.location).toBe(url)

      // restore env
      process.env.UPLOAD_MAX_SIZE_BYTES = prevLimit
    },
    60000,
  )

  it(
    "uploads a png successfully and writes registry + file",
    async () => {
      const pngBuffer = Buffer.from([
        // Minimal PNG header bytes (content isn't validated server-side)
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        // Some arbitrary bytes to make it non-empty
        0x00, 0x00, 0x00, 0x0d,
      ])

      const res = await request
        .post("/api/images/upload")
        .attach("file", pngBuffer, { filename: "sample.png", contentType: "image/png" })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("baseImageId")
      expect(res.body).toHaveProperty("url")
      expect(res.body.url).toMatch(/^https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/images\/uploads\//)

      const { baseImageId } = res.body as { baseImageId: string; url: string }

      // Verify the upload appears in the API (database-driven now)
      const uploadsRes = await request.get("/api/images/upload")
      expect(uploadsRes.status).toBe(200)
      const uploads = uploadsRes.body as Array<any>
      const rec = uploads.find((x) => x.id === baseImageId)
      expect(rec).toBeTruthy()
      expect(rec.filename).toBe("sample.png")
    },
    30000,
  )

  it(
    "adds uploaded image to gallery so it appears in /api/gallery",
    async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d,
      ])

      const res = await request
        .post("/api/images/upload")
        .attach("file", pngBuffer, { filename: "gallery-add.png", contentType: "image/png" })

      expect(res.status).toBe(200)
      const { baseImageId, url } = res.body as { baseImageId: string; url: string }
      expect(baseImageId).toBeTruthy()

      // Verify the GET endpoint returns it (now database-driven)
      const resGet = await request.get("/api/gallery")
      expect(resGet.status).toBe(200)
      const list = resGet.body as any[]
      const inGallery = list.find((x) => x.id === baseImageId)
      expect(inGallery).toBeTruthy()
      expect(inGallery.url).toBe(url)
    },
    30000,
  )
})
