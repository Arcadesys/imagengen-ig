import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "./db"
import { supabaseAdmin } from "./supabase"

/**
 * Get appropriate temp directory based on environment
 */
function getTempDir(): string {
  // In serverless environments (Vercel, AWS Lambda), use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return '/tmp'
  }
  // In local development, use project temp directory
  return path.join(process.cwd(), "temp")
}

/**
 * Convert data URL to Buffer
 */
export function dataURLToBuffer(dataURL: string): Buffer {
  const base64Data = dataURL.split(",")[1]
  return Buffer.from(base64Data, "base64")
}

/**
 * Get base image buffer from Supabase Storage or legacy paths
 */
export async function getBaseImageBuffer(baseImageId: string): Promise<Buffer | null> {
  // 1) Check legacy disk path first
  const baseDir = path.join(process.cwd(), "public", "uploads", "base")
  const exts = [".png", ".jpg", ".jpeg", ".webp", ".avif"]
  for (const ext of exts) {
    const p = path.join(baseDir, `${baseImageId}${ext}`)
    if (existsSync(p)) {
      const fs = await import("fs/promises")
      return fs.readFile(p)
    }
  }
  
  // 2) Try database to get image record
  const rec = await prisma.image.findUnique({ 
    where: { id: baseImageId },
    select: { url: true, mimeType: true }
  })
  
  if (!rec) return null
  
  // 3) Download from Supabase Storage
  try {
    const urlParts = rec.url.split('/images/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      const { data, error } = await supabaseAdmin.storage
        .from('images')
        .download(filePath)
      
      if (error || !data) {
        console.warn(`Failed to download image from storage: ${error?.message}`)
        return null
      }
      
      return Buffer.from(await data.arrayBuffer())
    }
  } catch (error) {
    console.warn(`Error downloading image from storage:`, error)
  }
  
  return null
}

/**
 * Get path to base image, materializing from Supabase Storage if needed
 */
export async function getBaseImagePath(baseImageId: string): Promise<string | null> {
  // 1) Check legacy disk path
  const baseDir = path.join(process.cwd(), "public", "uploads", "base")
  const exts = [".png", ".jpg", ".jpeg", ".webp", ".avif"]
  for (const ext of exts) {
    const p = path.join(baseDir, `${baseImageId}${ext}`)
    if (existsSync(p)) return p
  }
  
  // 2) Get buffer from Supabase and materialize to temp file
  const buffer = await getBaseImageBuffer(baseImageId)
  if (!buffer) return null
  
  const rec = await prisma.image.findUnique({ 
    where: { id: baseImageId },
    select: { mimeType: true }
  })
  
  const ext = rec?.mimeType.includes("png")
    ? ".png"
    : rec?.mimeType.includes("jpeg") || rec?.mimeType.includes("jpg")
      ? ".jpg"
      : rec?.mimeType.includes("webp")
        ? ".webp"
        : rec?.mimeType.includes("avif")
          ? ".avif"
          : ".png"
  
  const tempDir = getTempDir()
  if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true })
  
  const p = path.join(tempDir, `base-${baseImageId}${ext}`)
  await writeFile(p, buffer)
  return p
}

/**
 * Ensure required directories exist
 */
export async function ensureDirectories(): Promise<void> {
  const tempDir = getTempDir()

  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true })
  }
}

/**
 * Validate generation request
 */
export function validateGenerateRequest(body: any): { isValid: boolean; error?: string } {
  const { prompt, size, n } = body

  if (!prompt || typeof prompt !== "string") {
    return { isValid: false, error: "Prompt is required and must be a string" }
  }

  // Validate number of images first so tests expecting this error don't get pre-empted by size errors
  if (!n || n < 1 || n > 4) {
    return { isValid: false, error: "Number of images must be between 1 and 4" }
  }

  // Size becomes optional for Auto. If provided, validate; if omitted, we'll choose a default later.
  if (size != null && !["512x512", "1024x1024", "1024x1536", "1536x1024"].includes(size)) {
    return { isValid: false, error: "Invalid size. Must be 512x512, 1024x1024, 1024x1536, or 1536x1024" }
  }

  return { isValid: true }
}