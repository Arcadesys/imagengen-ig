import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/db"

export async function GET(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 })
  const id = filename.split(".")[0]
  const image = await prisma.image.findUnique({ where: { id }, include: { blob: true } })
  if (!image || !image.blob?.data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(image.blob.data as any, {
    headers: { "Content-Type": image.mimeType, "Cache-Control": "public, max-age=31536000, immutable" },
  })
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
