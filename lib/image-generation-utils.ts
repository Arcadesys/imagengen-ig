import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "./db"

/**
 * Convert data URL to Buffer
 */
export function dataURLToBuffer(dataURL: string): Buffer {
  const base64Data = dataURL.split(",")[1]
  return Buffer.from(base64Data, "base64")
}

/**
 * Get path to base image, checking both disk and database
 */
export async function getBaseImagePath(baseImageId: string): Promise<string | null> {
  // 1) Check legacy disk path
  const baseDir = path.join(process.cwd(), "public", "uploads", "base")
  const exts = [".png", ".jpg", ".jpeg", ".webp", ".avif"]
  for (const ext of exts) {
    const p = path.join(baseDir, `${baseImageId}${ext}`)
    if (existsSync(p)) return p
  }
  
  // 2) Try DB and materialize to temp file
  const rec = await prisma.image.findUnique({ where: { id: baseImageId }, include: { blob: true } })
  if (!rec || !rec.blob?.data) return null
  
  const ext = rec.mimeType.includes("png")
    ? ".png"
    : rec.mimeType.includes("jpeg") || rec.mimeType.includes("jpg")
      ? ".jpg"
      : rec.mimeType.includes("webp")
        ? ".webp"
        : rec.mimeType.includes("avif")
          ? ".avif"
          : ".png"
  
  const tempDir = path.join(process.cwd(), "temp")
  if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true })
  
  const p = path.join(tempDir, `base-${baseImageId}${ext}`)
  await writeFile(p, Buffer.from(rec.blob.data as any))
  return p
}

/**
 * Ensure required directories exist
 */
export async function ensureDirectories(): Promise<void> {
  const generatedDir = path.join(process.cwd(), "public", "generated")
  const dataDir = path.join(process.cwd(), "data")
  const tempDir = path.join(process.cwd(), "temp")

  if (!existsSync(generatedDir)) {
    await mkdir(generatedDir, { recursive: true })
  }
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true })
  }
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true })
  }
}

/**
 * Validate generation request
 */
export function validateGenerateRequest(body: any): { isValid: boolean; error?: string } {
  const { prompt, size, n, maskData, baseImageId } = body

  if (!prompt || typeof prompt !== "string") {
    return { isValid: false, error: "Prompt is required and must be a string" }
  }

  // Size becomes optional for Auto. If provided, validate; if omitted, we'll choose a default later.
  if (size != null && !["512x512", "768x768", "1024x1024"].includes(size)) {
    return { isValid: false, error: "Invalid size. Must be 512x512, 768x768, or 1024x1024" }
  }

  if (!n || n < 1 || n > 4) {
    return { isValid: false, error: "Number of images must be between 1 and 4" }
  }

  if (maskData && !baseImageId) {
    return { isValid: false, error: "Base image is required when using mask" }
  }

  if (maskData && n > 1) {
    return { isValid: false, error: "Mask editing only supports generating 1 image at a time" }
  }

  return { isValid: true }
}