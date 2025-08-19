import { prisma } from "./db"

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
  size?: string | null
  seed?: string | number | null
  baseImageId?: string | null
  hasMask?: boolean | null
  provider?: string | null
}

export async function saveImage(opts: SaveImageOptions) {
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
      size: opts.size ?? null,
      seed: opts.seed != null ? String(opts.seed) : null,
      baseImageId: opts.baseImageId ?? null,
      hasMask: opts.hasMask ?? false,
      provider: opts.provider ?? null,
    },
  })
  const ext = extFromMime(opts.mimeType)
  const url = opts.kind === "UPLOAD_BASE" ? `/uploads/base/${rec.id}${ext}` : `/generated/${rec.id}${ext}`
  const updated = await prisma.image.update({ where: { id: rec.id }, data: { url } })
  // Store binary in a separate table to keep metadata light
  await prisma.imageBlob.create({ data: { id: updated.id, data: opts.buffer } })
  return updated
}
