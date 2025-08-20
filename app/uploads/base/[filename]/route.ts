import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/db"

export async function GET(_: NextRequest, context: { params: Promise<{ filename: string }> } | { params: { filename: string } }) {
  // Support both sync and async params shapes to avoid Next.js dev warning
  // @ts-ignore
  const p = context.params?.then ? await (context as any).params : (context as any).params
  const filename = p?.filename
  if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 })
  const id = filename.split(".")[0]
  const image = await prisma.image.findUnique({ where: { id }, include: { blob: true } })
  if (!image || !image.blob?.data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(image.blob.data as any, {
    headers: { "Content-Type": image.mimeType, "Cache-Control": "public, max-age=31536000, immutable" },
  })
}
