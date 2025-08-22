import { prisma } from "./db"
import { supabaseAdmin } from "./supabase"
import type { ImageSize } from "@prisma/client"

function extFromMime(mime: string): string {
  if (!mime) return ".png"
  if (mime.includes("png")) return ".png"
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg"
  if (mime.includes("webp")) return ".webp"
  if (mime.includes("avif")) return ".avif"
  return ".png"
}

export type ImageKind = "UPLOAD_BASE" | "GENERATED"

export interface SaveImageOptions {
  kind: ImageKind
  mimeType: string
  buffer: Buffer
  width?: number | null
  height?: number | null
  originalName?: string | null
  // generation metadata
  prompt?: string | null
  expandedPrompt?: string | null
  size?: ImageSize | null
  seed?: string | number | null
  baseImageId?: string | null
  hasMask?: boolean | null
  provider?: string | null
  sessionId?: string | null // Added for session grouping
}

export async function saveImage(opts: SaveImageOptions) {
  // Create the database record first to get an ID
  const rec = await prisma.image.create({
    data: {
      kind: opts.kind as any,
      // placeholder, updated after we have an id
      url: "",
      mimeType: opts.mimeType,
      width: opts.width ?? null,
      height: opts.height ?? null,
      sizeBytes: opts.buffer.length,
      originalName: opts.originalName ?? null,
      prompt: opts.prompt ?? null,
      expandedPrompt: opts.expandedPrompt ?? null,
      // Deprecated: we no longer persist the human-readable generation size to DB (Auto sizing)
      size: null,
      seed: opts.seed != null ? String(opts.seed) : null,
      baseImageId: opts.baseImageId ?? null,
      hasMask: opts.hasMask ?? false,
      provider: opts.provider ?? null,
      sessionId: opts.sessionId ?? null, // Added for session grouping
    },
  })

  // Generate the file path for Supabase Storage
  const ext = extFromMime(opts.mimeType)
  const bucket = opts.kind === "UPLOAD_BASE" ? "uploads" : "generated"
  const filePath = `${bucket}/${rec.id}${ext}`
  
  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('images')
    .upload(filePath, opts.buffer, {
      contentType: opts.mimeType,
      upsert: false,
    })

  if (uploadError) {
    // Clean up the database record if upload fails
    await prisma.image.delete({ where: { id: rec.id } })
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
  }

  // Get the public URL for the uploaded image
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(filePath)

  // Update the database record with the public URL
  const updated = await prisma.image.update({ 
    where: { id: rec.id }, 
    data: { url: publicUrl } 
  })

  return updated
}

export async function deleteImage(imageId: string) {
  const image = await prisma.image.findUnique({ 
    where: { id: imageId },
    select: { url: true, kind: true }
  })
  
  if (!image) {
    throw new Error('Image not found')
  }

  // Extract the file path from the URL
  const urlParts = image.url.split('/images/')
  if (urlParts.length > 1) {
    const filePath = urlParts[1]
    
    // Delete from Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('images')
      .remove([filePath])
    
    if (error) {
      console.warn(`Failed to delete image from storage: ${error.message}`)
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete from database
  await prisma.image.delete({ where: { id: imageId } })
}
