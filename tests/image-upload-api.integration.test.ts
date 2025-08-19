import { describe, it, expect, beforeAll, afterAll } from "vitest"
import supertest from "supertest"
import { createServer } from "http"
import next from "next"
import path from "path"
import fs from "fs"

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
      expect(url).toMatch(/^\/uploads\/base\//)
      expect(baseImageId).toBeTruthy()

      const expectedRel = url.replace(/^\//, "")
      const filePath = path.join(process.cwd(), "public", expectedRel.replace(/^public\//, ""))
      const stat = await fs.promises.stat(filePath)
      expect(stat.size).toBeLessThanOrEqual(Number(process.env.UPLOAD_MAX_SIZE_BYTES))

      // cleanup file and registry entry
      const uploadsPath = path.join(process.cwd(), "data", "uploads.json")
      try {
        await fs.promises.unlink(filePath)
      } catch {}
      try {
        const json = JSON.parse(await fs.promises.readFile(uploadsPath, "utf8")) as any[]
        const filtered = json.filter((x) => x.id !== baseImageId)
        await fs.promises.writeFile(uploadsPath, JSON.stringify(filtered, null, 2), "utf8")
      } catch {}

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
      expect(res.body.url).toMatch(/^\/uploads\/base\/.+\.png$/)

      const { baseImageId, url } = res.body as { baseImageId: string; url: string }

      // Verify file exists on disk
      const expectedRel = url.replace(/^\//, "") // strip leading slash
      const filePath = path.join(process.cwd(), "public", expectedRel.replace(/^public\//, ""))
      expect(await fileExists(filePath)).toBe(true)

      // Verify registry contains the upload record
      const uploadsPath = path.join(process.cwd(), "data", "uploads.json")
      expect(await fileExists(uploadsPath)).toBe(true)
      const json = JSON.parse(await fs.promises.readFile(uploadsPath, "utf8")) as Array<any>
      const rec = json.find((x) => x.id === baseImageId)
      expect(rec).toBeTruthy()
      expect(rec.filename).toBe("sample.png")

      // Cleanup: remove created artifacts
      try {
        if (await fileExists(filePath)) {
          await fs.promises.unlink(filePath)
        }
        if (await fileExists(uploadsPath)) {
          const updated = (json as any[]).filter((x) => x.id !== baseImageId)
          await fs.promises.writeFile(uploadsPath, JSON.stringify(updated, null, 2), "utf8")
        }
      } catch (e) {
        // Swallow cleanup errors in tests
      }
    },
    30000,
  )

  it(
    "adds uploaded image to gallery.json so it appears in /api/gallery",
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

      // Verify gallery contains the upload record
      const galleryPath = path.join(process.cwd(), "data", "gallery.json")
      const gallery = JSON.parse(await fs.promises.readFile(galleryPath, "utf8")) as Array<any>
      const inGallery = gallery.find((x) => x.id === baseImageId)
      expect(inGallery).toBeTruthy()
      expect(inGallery.url).toBe(url)

      // Verify the GET endpoint also returns it
      const resGet = await request.get("/api/gallery")
      expect(resGet.status).toBe(200)
      const list = resGet.body as any[]
      expect(list.some((x) => x.id === baseImageId)).toBe(true)

      // Cleanup artifacts: file, uploads.json entry, gallery.json entry
      const expectedRel = url.replace(/^\//, "")
      const filePath = path.join(process.cwd(), "public", expectedRel.replace(/^public\//, ""))
      try {
        await fs.promises.unlink(filePath)
      } catch {}

      const uploadsPath = path.join(process.cwd(), "data", "uploads.json")
      try {
        const json = JSON.parse(await fs.promises.readFile(uploadsPath, "utf8")) as any[]
        const filtered = json.filter((x) => x.id !== baseImageId)
        await fs.promises.writeFile(uploadsPath, JSON.stringify(filtered, null, 2), "utf8")
      } catch {}

      try {
        const json = JSON.parse(await fs.promises.readFile(galleryPath, "utf8")) as any[]
        const filtered = json.filter((x) => x.id !== baseImageId)
        await fs.promises.writeFile(galleryPath, JSON.stringify(filtered, null, 2), "utf8")
      } catch {}
    },
    30000,
  )
})
